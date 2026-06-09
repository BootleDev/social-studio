/**
 * Airtable integration for reading intelligence data.
 * Pattern from social-dashboard/src/lib/airtable.ts
 */

import {
  hasSupabaseDbUrl,
  getLatestTrendReportFromSupabase,
} from "./supabase";

const BASE_URL = "https://api.airtable.com/v0";

export const TABLES = {
  POSTS: "tbljDi7YY46pQkQGH",
  CONTENT_LIBRARY: "tbl5IMvmWyqGfuwSv",
  TREND_REPORTS: "tblzP9injn5376eCS",
  CREATIVE_BRIEFS: "tblUR5S3ZcJKd6BEz",
  SCHEDULE_QUEUE: "tblNRzQrSJnULwXKL",
} as const;

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

function getCredentials(): { baseId: string; apiKey: string } {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!baseId || !apiKey) {
    throw new Error(
      "Missing Airtable credentials (AIRTABLE_BASE_ID or AIRTABLE_API_KEY)",
    );
  }
  return { baseId, apiKey };
}

async function fetchRecords(
  tableId: string,
  options: {
    filterByFormula?: string;
    sort?: Array<{ field: string; direction: "asc" | "desc" }>;
    fields?: string[];
    maxRecords?: number;
  } = {},
): Promise<AirtableRecord[]> {
  const { baseId, apiKey } = getCredentials();
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams();
    if (options.filterByFormula)
      params.set("filterByFormula", options.filterByFormula);
    if (options.maxRecords)
      params.set("maxRecords", String(options.maxRecords));
    if (offset) params.set("offset", offset);

    if (options.sort) {
      options.sort.forEach((s, i) => {
        params.set(`sort[${i}][field]`, s.field);
        params.set(`sort[${i}][direction]`, s.direction);
      });
    }

    if (options.fields) {
      options.fields.forEach((f) => params.append("fields[]", f));
    }

    const url = `${BASE_URL}/${baseId}/${tableId}?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable error ${res.status}: ${err}`);
    }

    const data: AirtableResponse = await res.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

/**
 * Get the latest trend report directly from Airtable. This is the original,
 * unchanged read path, kept as the fail-closed fallback for the Supabase path.
 */
async function getLatestTrendReportFromAirtable() {
  const records = await fetchRecords(TABLES.TREND_REPORTS, {
    sort: [{ field: "Report Date", direction: "desc" }],
    maxRecords: 1,
  });
  return records[0]?.fields ?? null;
}

/**
 * Get the latest trend report (WEBDEV-207 read-repoint).
 *
 * When SUPABASE_DB_URL is configured, read from Supabase
 * (social.trend_reports) and fall back to Airtable on ANY error OR an empty
 * result, so a Supabase outage can never throw or 500 the AI route. The
 * Supabase path returns the SAME shape and byte-identical "Full Report" as the
 * Airtable path. Without SUPABASE_DB_URL, behaviour is unchanged (Airtable).
 *
 * Override with TREND_REPORT_SOURCE=airtable to force the Airtable path even
 * when SUPABASE_DB_URL is present (kill switch).
 */
export async function getLatestTrendReport() {
  const forceAirtable =
    process.env.TREND_REPORT_SOURCE?.toLowerCase() === "airtable";

  if (!forceAirtable && hasSupabaseDbUrl()) {
    try {
      const fromSupabase = await getLatestTrendReportFromSupabase();
      if (fromSupabase) return fromSupabase;
      // Empty result -> fall through to Airtable rather than returning null.
      console.warn(
        "[trend-report] Supabase returned no rows; falling back to Airtable",
      );
    } catch (err) {
      console.error(
        "[trend-report] Supabase read failed; falling back to Airtable:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  return getLatestTrendReportFromAirtable();
}

/** Get recent Bootle posts with metrics. */
export async function getRecentPosts(limit = 10) {
  const records = await fetchRecords(TABLES.POSTS, {
    sort: [{ field: "Published At", direction: "desc" }],
    maxRecords: limit,
    fields: [
      "Caption",
      "Platform",
      "Post Type",
      "Published At",
      "Likes",
      "Comments",
      "Reach",
      "Engagement Rate",
      "Saves",
      "Shares",
      "Video Views",
      "Hashtags",
    ],
  });
  return records.map((r) => r.fields);
}

/** Get top creative briefs. */
export async function getTopCreativeBriefs(limit = 3) {
  const records = await fetchRecords(TABLES.CREATIVE_BRIEFS, {
    sort: [{ field: "Brief Date", direction: "desc" }],
    maxRecords: limit,
    fields: [
      "Brief Title",
      "Format",
      "Platform",
      "Hook",
      "Script",
      "Scene Breakdown",
      "CTA",
    ],
  });
  return records.map((r) => r.fields);
}

/** Get top competitor content by views. */
export async function getTopCompetitorContent(limit = 10) {
  const records = await fetchRecords(TABLES.CONTENT_LIBRARY, {
    sort: [{ field: "Views", direction: "desc" }],
    maxRecords: limit,
    fields: [
      "Handle",
      "Platform",
      "Caption",
      "Views",
      "Likes",
      "Topic",
      "Hook Structure",
      "Body Structure",
      "Spoken Hook",
    ],
  });
  return records.map((r) => r.fields);
}

/** Assemble all intelligence context for the AI. */
export async function getIntelligenceContext() {
  const [trendReport, recentPosts, creativeBriefs, topCompetitorContent] =
    await Promise.all([
      getLatestTrendReport(),
      getRecentPosts(10),
      getTopCreativeBriefs(3),
      getTopCompetitorContent(10),
    ]);

  return { trendReport, recentPosts, creativeBriefs, topCompetitorContent };
}
