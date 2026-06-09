/**
 * Supabase (Postgres) read layer for the latest trend report.
 *
 * WEBDEV-207: lowest-risk slice of the Airtable -> Supabase machine-data
 * migration. ONLY the latest-trend-report read is repointed here; every other
 * intelligence getter stays on Airtable (see ./airtable.ts).
 *
 * Mechanism: a direct node-pg connection over SUPABASE_DB_URL, SERVER-SIDE
 * ONLY (the `import "server-only"` below turns any client import into a build
 * error). SUPABASE_DB_URL must be the Supabase TRANSACTION POOLER
 * (...pooler.supabase.com:6543) — short-lived serverless invocations should
 * never hold a direct-Postgres connection. The connection string is read from
 * process.env at runtime and must never be exposed to the client (no PUBLIC_/
 * NEXT_PUBLIC_ prefix). The connection gotchas below mirror
 * ~/Projects/Bootle/shared/cc-bridge/db.js:
 *   - the Supabase DB-URL password can contain % or ?, which makes WHATWG
 *     `new URL()` (and pg-connection-string) throw "Invalid URL", so we parse
 *     the URL into discrete fields and hand the password to the driver verbatim
 *   - TLS is verified against the pinned Supabase Root 2021 CA (the pooler
 *     presents a private chain whose self-signed root is not in the system
 *     trust store), so rejectUnauthorized stays true (full cert + hostname
 *     verification) instead of the previous accept-anything posture
 *   - a `pool.on('error')` listener so an idle backend drop (pooler idle
 *     timeout, DB restart, network blip) is logged and swallowed instead of
 *     escalating to an uncaught exception that crashes the process
 *   - the connect/query timeouts below time-bound a slow/hung pooler so the
 *     getLatestTrendReport() fallback can fail over to Airtable fast
 *   - setTypeParser(1082, identity) so a `date` column comes back as its raw
 *     "YYYY-MM-DD" string (matching Airtable's "Report Date" string exactly)
 *     rather than a JS Date, which would shift under the server's timezone.
 */

import "server-only";
import pg from "pg";
import { SUPABASE_ROOT_CA_2021 } from "./supabase-ca";

// int8 (OID 20): return as a JS number, not a string. Defensive/inert for
// social.trend_reports — videos_analysed is int4 (OID 23), which pg already
// parses to a number; this only matters if a future column is int8/bigint.
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
// date (OID 1082): return the raw "YYYY-MM-DD" string verbatim. The default
// parser builds a local-midnight JS Date that the JSON prompt would then
// stringify with a timezone offset; we need the exact Airtable string. This
// parser IS load-bearing for report_date — do not remove it.
pg.types.setTypeParser(1082, (v) => v);

const DB_URL = process.env.SUPABASE_DB_URL;

// Hard ceiling on the whole Supabase read (connect + TLS + query). Belt-and-
// suspenders over the pg-level timeouts below: the Supavisor pooler may not
// honor statement_timeout, so a Promise.race guarantees getLatestTrendReport()
// fails over to Airtable rather than hanging the AI route.
const SUPABASE_READ_TIMEOUT_MS = 4000;

let pool: pg.Pool | null = null;

/**
 * Parse postgres://user:password@host[:port]/db into discrete fields. We do NOT
 * hand the raw URL to pg's connectionString option: Supabase DB passwords can
 * contain characters (e.g. % or ?) that are not percent-encoded, which makes
 * WHATWG `new URL()` throw. The password group is greedy up to the LAST '@' so
 * an '@' inside it is tolerated; the host segment after it never contains '@'.
 *
 * Module-private on purpose: it returns the cleartext password, so we keep the
 * surface narrow (not exported).
 */
function parseDbUrl(url: string): {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
} {
  const m = url.match(
    /^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+)(?::(\d+))?(?:\/([^?]+))?/,
  );
  if (!m) {
    throw new Error(
      "SUPABASE_DB_URL must look like postgres://user:password@host[:port]/database",
    );
  }
  const [, user, password, host, port, database] = m;
  return {
    user,
    password,
    host,
    port: port ? Number(port) : 5432,
    database: database || "postgres",
  };
}

function getPool(): pg.Pool {
  if (!DB_URL) {
    throw new Error("SUPABASE_DB_URL is not set");
  }
  if (!pool) {
    pool = new pg.Pool({
      ...parseDbUrl(DB_URL),
      // Full TLS verification against the pinned Supabase root (the pooler's
      // self-signed root is not in the system trust store). See ./supabase-ca.
      ssl: { ca: SUPABASE_ROOT_CA_2021, rejectUnauthorized: true },
      max: 2,
      // Time-bound a slow/hung pooler so a stall fails over to Airtable fast.
      connectionTimeoutMillis: 3000,
      query_timeout: 4000,
      statement_timeout: 4000,
      idleTimeoutMillis: 10000,
      allowExitOnIdle: true,
      keepAlive: true,
    });
    // Without this listener pg escalates an idle-client error to an uncaught
    // exception that would crash the server. Log and swallow; the next query
    // reconnects.
    pool.on("error", (err) => {
      console.error("[supabase] idle pg client error:", err.message);
    });
  }
  return pool;
}

/** True when SUPABASE_DB_URL is configured (so the Supabase path is usable). */
export function hasSupabaseDbUrl(): boolean {
  return Boolean(DB_URL);
}

// The columns the Supabase mapping depends on. If any is ABSENT from the row
// (a rename/drop), we throw so getLatestTrendReport()'s catch engages Airtable
// rather than silently feeding the LLM a prompt with missing fields.
const EXPECTED_COLUMNS = [
  "report_date",
  "full_report",
  "hook_breakdown",
  "platform_breakdown",
  "period",
  "videos_analysed",
] as const;

/**
 * Latest trend report from Supabase `social.trend_reports`, returned in the
 * EXACT shape getLatestTrendReport() returns from Airtable: the keys are the
 * Airtable display names and `Full Report` is byte-identical HTML/text fed
 * straight into the AI prompt. Returns null when the table is empty.
 *
 * report_date is the sort key; updated_at desc is a deterministic tiebreak in
 * the (currently non-existent) case of two reports sharing a date.
 *
 * The whole read is raced against SUPABASE_READ_TIMEOUT_MS so a stall at
 * connect/TLS/query rejects and lands in the caller's Airtable fallback.
 */
export async function getLatestTrendReportFromSupabase(): Promise<Record<
  string,
  unknown
> | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `Supabase read timed out after ${SUPABASE_READ_TIMEOUT_MS}ms`,
          ),
        ),
      SUPABASE_READ_TIMEOUT_MS,
    );
  });

  const read = (async () => {
    const { rows } = await getPool().query(
      `select report_date, full_report, hook_breakdown, platform_breakdown,
              period, videos_analysed
         from social.trend_reports
        order by report_date desc, updated_at desc nulls last
        limit 1`,
    );
    const r = rows[0];
    if (!r) return null;

    // Schema-rename guard: a renamed/dropped column comes back ABSENT from the
    // row object, whereas a genuine SQL NULL comes back as a present `null`
    // key. Use `in` (not === undefined) to tell them apart and throw on absence
    // so the Airtable fallback engages instead of a degraded prompt.
    for (const col of EXPECTED_COLUMNS) {
      if (!(col in r)) {
        throw new Error(
          `social.trend_reports is missing expected column "${col}" ` +
            "(schema drift?); failing over to Airtable",
        );
      }
    }

    return {
      "Report Date": r.report_date,
      "Full Report": r.full_report,
      "Hook Breakdown": r.hook_breakdown,
      "Platform Breakdown": r.platform_breakdown,
      Period: r.period,
      "Videos Analysed": r.videos_analysed,
    };
  })();

  try {
    return await Promise.race([read, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
