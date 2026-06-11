/**
 * Kill-switch parsing for the WEBDEV-207 trend-report repoint, extracted from
 * airtable.ts so it is unit-testable without importing the `server-only` / pg
 * chain that airtable.ts pulls in (same rationale and semantics as the
 * ad-dashboard / social-dashboard sourceSwitch modules, WEBDEV-194/210).
 *
 * TREND_REPORT_SOURCE=airtable forces the legacy Airtable path even when
 * SUPABASE_DB_URL is present. This is the ONLY manual rollback mechanism, so
 * the match is whitespace- and case-insensitive — a value pasted into Vercel
 * with a trailing newline ("airtable\n") or stray spaces ("  Airtable ") must
 * still roll back. Any other non-empty value logs a console.warn on EVERY
 * call (no memo, stays pure) so a typo ("airtabel") shows up in the Vercel
 * logs instead of silently no-oping the rollback.
 */
export function forcedToAirtable(
  envVar: string | undefined,
  varName: string,
): boolean {
  if (envVar === undefined) return false;
  const normalized = envVar.trim().toLowerCase();
  if (normalized === "airtable") return true;
  if (normalized !== "") {
    console.warn(
      `[kill-switch] ${varName}=${JSON.stringify(envVar)} is not the ` +
        `recognized value "airtable" — switch IGNORED, Supabase-first path ` +
        `stays active. Fix the env var in Vercel and redeploy to roll back.`,
    );
  }
  return false;
}
