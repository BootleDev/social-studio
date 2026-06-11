/**
 * Pure row -> Airtable-envelope mapper for the Supabase trend-report read
 * (WEBDEV-207), extracted from supabase.ts so it is unit-testable WITHOUT the
 * `server-only` / pg connection layer (same rationale as the ad-dashboard /
 * social-dashboard supabaseMappers modules, WEBDEV-194/210).
 *
 * The contract pinned by supabaseMappers.test.ts: the emitted keys are the
 * EXACT Airtable display names and every value is verbatim passthrough —
 * `Full Report` is fed byte-identical into the AI prompt, and `Report Date`
 * must stay the raw "YYYY-MM-DD" string produced by the pg type parser in
 * supabase.ts (a mapper that starts reformatting dates fails `npm test`,
 * which gates every Vercel deploy via vercel.json buildCommand).
 */

/**
 * The columns the Supabase mapping depends on. If any is ABSENT from the row
 * (a rename/drop), mapTrendReportRow throws so getLatestTrendReport()'s catch
 * engages Airtable rather than silently feeding the LLM a degraded prompt.
 */
export const EXPECTED_COLUMNS = [
  "report_date",
  "full_report",
  "hook_breakdown",
  "platform_breakdown",
  "period",
  "videos_analysed",
] as const;

/**
 * Map a `social.trend_reports` row to the EXACT shape getLatestTrendReport()
 * returns from Airtable.
 *
 * Schema-rename guard: a renamed/dropped column comes back ABSENT from the
 * row object, whereas a genuine SQL NULL comes back as a present `null` key.
 * Use `in` (not === undefined) to tell them apart and throw on absence so the
 * Airtable fallback engages instead of a degraded prompt.
 */
export function mapTrendReportRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  for (const col of EXPECTED_COLUMNS) {
    if (!(col in row)) {
      throw new Error(
        `social.trend_reports is missing expected column "${col}" ` +
          "(schema drift?); failing over to Airtable",
      );
    }
  }

  return {
    "Report Date": row.report_date,
    "Full Report": row.full_report,
    "Hook Breakdown": row.hook_breakdown,
    "Platform Breakdown": row.platform_breakdown,
    Period: row.period,
    "Videos Analysed": row.videos_analysed,
  };
}
