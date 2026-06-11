/**
 * Pure unit tests for the Supabase row -> Airtable-envelope trend-report
 * mapper (WEBDEV-207 read path). NO live DB: these exercise the pure mapper
 * extracted out of supabase.ts (WEBDEV-215) so the shape-critical contract is
 * locked by `npm test`, which runs on every PR/push
 * (.github/workflows/ci.yml) and gates every Vercel deploy (vercel.json
 * buildCommand).
 *
 * What this pins:
 *   - the emitted key set is EXACTLY the Airtable display names the AI route
 *     reads ("Report Date" / "Full Report" / "Hook Breakdown" /
 *     "Platform Breakdown" / "Period" / "Videos Analysed")
 *   - every value is VERBATIM passthrough — "Full Report" is fed
 *     byte-identical into the AI prompt; "Report Date" stays the raw
 *     "YYYY-MM-DD" string produced by the pg date type parser
 *   - the schema-drift guard: an ABSENT column (rename/drop) throws so
 *     getLatestTrendReport()'s catch fails over to Airtable, while a present
 *     SQL NULL passes through as null (sparse data is legitimate)
 */

import { describe, it, expect } from "vitest";
import { mapTrendReportRow, EXPECTED_COLUMNS } from "../supabaseMappers";

// A full social.trend_reports row as it arrives from pg AFTER the type
// parsers in supabase.ts (date stays a "YYYY-MM-DD" string; jsonb columns
// arrive as parsed objects/strings; int4 as a number).
function trendReportRow(overrides: Record<string, unknown> = {}) {
  return {
    report_date: "2026-06-08",
    full_report: "<h2>Weekly Trends</h2><p>Hooks that worked…</p>",
    hook_breakdown: '{"question": 12, "statement": 7}',
    platform_breakdown: '{"tiktok": 31, "instagram": 24}',
    period: "2026-06-01 to 2026-06-07",
    videos_analysed: 55,
    ...overrides,
  };
}

describe("mapTrendReportRow", () => {
  it("emits EXACTLY the Airtable display-name key set", () => {
    const out = mapTrendReportRow(trendReportRow());
    expect(Object.keys(out).sort()).toEqual(
      [
        "Full Report",
        "Hook Breakdown",
        "Period",
        "Platform Breakdown",
        "Report Date",
        "Videos Analysed",
      ].sort(),
    );
    // Tie the output size to the guard list: a column added to
    // EXPECTED_COLUMNS but not to the mapper's return object would otherwise
    // pass the guard and be silently dropped from the AI prompt.
    expect(Object.keys(out)).toHaveLength(EXPECTED_COLUMNS.length);
  });

  it("passes every value through VERBATIM (no reformatting, no scaling)", () => {
    const row = trendReportRow();
    const out = mapTrendReportRow(row);
    expect(out["Report Date"]).toBe(row.report_date);
    expect(out["Full Report"]).toBe(row.full_report);
    expect(out["Hook Breakdown"]).toBe(row.hook_breakdown);
    expect(out["Platform Breakdown"]).toBe(row.platform_breakdown);
    expect(out["Period"]).toBe(row.period);
    expect(out["Videos Analysed"]).toBe(row.videos_analysed);
  });

  it('keeps "Report Date" the raw YYYY-MM-DD STRING (not a JS Date)', () => {
    // The pg type parser for date (OID 1082) is configured to return the raw
    // string precisely so the value matches Airtable's "Report Date" exactly;
    // a mapper that turns it into a Date would shift under the server tz.
    const out = mapTrendReportRow(trendReportRow());
    expect(typeof out["Report Date"]).toBe("string");
    expect(out["Report Date"]).toBe("2026-06-08");
  });

  it("passes a present SQL NULL through as null (sparse data is legitimate)", () => {
    const out = mapTrendReportRow(
      trendReportRow({ hook_breakdown: null, videos_analysed: null }),
    );
    expect(out["Hook Breakdown"]).toBeNull();
    expect(out["Videos Analysed"]).toBeNull();
    // The other fields are unaffected.
    expect(out["Full Report"]).toBe(trendReportRow().full_report);
  });

  it.each(EXPECTED_COLUMNS)(
    'THROWS when column "%s" is ABSENT (schema rename/drop -> Airtable failover)',
    (col) => {
      const row = trendReportRow();
      delete (row as Record<string, unknown>)[col];
      expect(() => mapTrendReportRow(row)).toThrow(
        new RegExp(`missing expected column "${col}"`),
      );
    },
  );

  it("ignores extra columns (additive schema change is non-breaking)", () => {
    const out = mapTrendReportRow(
      trendReportRow({ new_column_we_dont_read: "whatever" }),
    );
    expect(Object.keys(out)).toHaveLength(6);
    expect(out).not.toHaveProperty("new_column_we_dont_read");
  });
});
