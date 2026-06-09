/**
 * WEBDEV-207 parity proof: getLatestTrendReport() via Airtable vs Supabase.
 *
 * Asserts, for the latest report_date:
 *   - identical key set (the six Airtable display names)
 *   - byte-identical "Full Report" (trailing whitespace normalized)
 *   - identical values for every other key
 *   - both paths return the genuinely-latest report by date
 *
 * SELF-SKIPS (exit 0) when SUPABASE_DB_URL / AIRTABLE_API_KEY / AIRTABLE_BASE_ID
 * are absent, so it is safe to run anywhere and never flakes a credentialed CI.
 * This is a manual proof script, NOT wired to any test runner.
 *
 * Run live once with the workspace secrets:
 *   set -a; . ~/Projects/Bootle/.secrets/.env; set +a
 *   AIRTABLE_BASE_ID=app0oKaYjbWBcrqzH \
 *     node scripts/parity-trend-report.mjs
 */
import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Pin the same Supabase Root 2021 CA the app uses (src/lib/supabase-ca.ts), so
// the parity proof exercises the hardened TLS path (rejectUnauthorized: true).
const SUPABASE_CA = (() => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, "..", "src", "lib", "supabase-ca.ts"), "utf8");
  const m = src.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/);
  if (!m) throw new Error("could not extract CA PEM from src/lib/supabase-ca.ts");
  return m[0] + "\n";
})();

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TREND_REPORTS_TABLE = "tblzP9injn5376eCS";

if (!SUPABASE_DB_URL || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.log(
    "[parity] SKIP — missing SUPABASE_DB_URL / AIRTABLE_API_KEY / AIRTABLE_BASE_ID",
  );
  process.exit(0);
}

pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
pg.types.setTypeParser(1082, (v) => v);

function parseDbUrl(url) {
  const m = url.match(
    /^postgres(?:ql)?:\/\/([^:]+):(.*)@([^:@/]+)(?::(\d+))?(?:\/([^?]+))?/,
  );
  if (!m) throw new Error("bad SUPABASE_DB_URL");
  const [, user, password, host, port, database] = m;
  return {
    user,
    password,
    host,
    port: port ? Number(port) : 5432,
    database: database || "postgres",
  };
}

async function fromSupabase() {
  const pool = new pg.Pool({
    ...parseDbUrl(SUPABASE_DB_URL),
    ssl: { ca: SUPABASE_CA, rejectUnauthorized: true },
    max: 1,
  });
  try {
    const { rows } = await pool.query(
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
  } finally {
    await pool.end();
  }
}

async function fromAirtable() {
  const params = new URLSearchParams();
  params.set("sort[0][field]", "Report Date");
  params.set("sort[0][direction]", "desc");
  params.set("maxRecords", "1");
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TREND_REPORTS_TABLE}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.records[0]?.fields ?? null;
}

function fail(msg) {
  console.error(`[parity] FAIL — ${msg}`);
  process.exit(1);
}

const [sb, at] = await Promise.all([fromSupabase(), fromAirtable()]);

if (!sb) fail("Supabase returned no row");
if (!at) fail("Airtable returned no row");

// 1) Genuinely latest by date — both must agree on report_date.
if (sb["Report Date"] !== at["Report Date"]) {
  fail(
    `Report Date mismatch — Supabase ${sb["Report Date"]} vs Airtable ${at["Report Date"]}`,
  );
}

// 2) Exact key set.
const sbKeys = Object.keys(sb).sort();
const atKeys = Object.keys(at).sort();
if (JSON.stringify(sbKeys) !== JSON.stringify(atKeys)) {
  fail(`key set mismatch\n  Supabase: ${sbKeys}\n  Airtable: ${atKeys}`);
}

// 3) Full Report byte-identical (normalize trailing whitespace only).
const norm = (s) => String(s).replace(/[ \t]+$/gm, "").replace(/\s+$/, "");
if (norm(sb["Full Report"]) !== norm(at["Full Report"])) {
  fail("Full Report differs after trailing-whitespace normalization");
}
// Stronger: raw byte-identical (report this, do not fail on it — Airtable may
// canonicalize trailing whitespace differently than the migrated copy).
const rawIdentical = sb["Full Report"] === at["Full Report"];

// 4) Every other scalar key identical.
for (const k of atKeys) {
  if (k === "Full Report") continue;
  if (String(sb[k]) !== String(at[k])) {
    fail(`value mismatch for "${k}" — Supabase ${sb[k]} vs Airtable ${at[k]}`);
  }
}

console.log("[parity] PASS");
console.log(`  Report Date:        ${at["Report Date"]}`);
console.log(`  keys:               ${atKeys.join(", ")}`);
console.log(`  Full Report length: Airtable ${at["Full Report"].length} / Supabase ${sb["Full Report"].length}`);
console.log(`  Full Report raw byte-identical: ${rawIdentical}`);
console.log(`  Full Report identical after trailing-ws normalization: true`);
