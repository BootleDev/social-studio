/**
 * Supabase (Postgres) read layer for the latest trend report.
 *
 * WEBDEV-207: lowest-risk slice of the Airtable -> Supabase machine-data
 * migration. ONLY the latest-trend-report read is repointed here; every other
 * intelligence getter stays on Airtable (see ./airtable.ts).
 *
 * Mechanism: a direct node-pg connection over SUPABASE_DB_URL, SERVER-SIDE
 * ONLY. The connection string is read from process.env at runtime and must
 * never be exposed to the client (no PUBLIC_/NEXT_PUBLIC_ prefix). The
 * connection gotchas below mirror ~/Projects/Bootle/shared/cc-bridge/db.js:
 *   - the Supabase DB-URL password can contain % or ?, which makes WHATWG
 *     `new URL()` (and pg-connection-string) throw "Invalid URL", so we parse
 *     the URL into discrete fields and hand the password to the driver verbatim
 *   - ssl { rejectUnauthorized: false } because Supabase requires TLS but its
 *     CA is not always in the local trust store
 *   - a `pool.on('error')` listener so an idle backend drop (pooler idle
 *     timeout, DB restart, network blip) is logged and swallowed instead of
 *     escalating to an uncaught exception that crashes the process
 *   - setTypeParser(20, Number) so int8 (videos counts etc.) come back as
 *     numbers rather than strings
 *   - setTypeParser(1082, identity) so a `date` column comes back as its raw
 *     "YYYY-MM-DD" string (matching Airtable's "Report Date" string exactly)
 *     rather than a JS Date, which would shift under the server's timezone.
 */

import pg from "pg";

// int8 (OID 20): return as a JS number, not a string.
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
// date (OID 1082): return the raw "YYYY-MM-DD" string verbatim. The default
// parser builds a local-midnight JS Date that the JSON prompt would then
// stringify with a timezone offset; we need the exact Airtable string.
pg.types.setTypeParser(1082, (v) => v);

const DB_URL = process.env.SUPABASE_DB_URL;

let pool: pg.Pool | null = null;

/**
 * Parse postgres://user:password@host[:port]/db into discrete fields. We do NOT
 * hand the raw URL to pg's connectionString option: Supabase DB passwords can
 * contain characters (e.g. % or ?) that are not percent-encoded, which makes
 * WHATWG `new URL()` throw. The password group is greedy up to the LAST '@' so
 * an '@' inside it is tolerated; the host segment after it never contains '@'.
 */
export function parseDbUrl(url: string): {
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
      ssl: { rejectUnauthorized: false },
      max: 2,
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

/**
 * Latest trend report from Supabase `social.trend_reports`, returned in the
 * EXACT shape getLatestTrendReport() returns from Airtable: the keys are the
 * Airtable display names and `Full Report` is byte-identical HTML/text fed
 * straight into the AI prompt. Returns null when the table is empty.
 *
 * report_date is the sort key; updated_at desc is a deterministic tiebreak in
 * the (currently non-existent) case of two reports sharing a date.
 */
export async function getLatestTrendReportFromSupabase(): Promise<Record<
  string,
  unknown
> | null> {
  const { rows } = await getPool().query(
    `select report_date, full_report, hook_breakdown, platform_breakdown,
            period, videos_analysed
       from social.trend_reports
      order by report_date desc, updated_at desc nulls last
      limit 1`,
  );
  const r = rows[0];
  if (!r) return null;

  return {
    "Report Date": r.report_date,
    "Full Report": r.full_report,
    "Hook Breakdown": r.hook_breakdown,
    "Platform Breakdown": r.platform_breakdown,
    Period: r.period,
    "Videos Analysed": r.videos_analysed,
  };
}
