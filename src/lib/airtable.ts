/**
 * Airtable integration for reading intelligence data.
 * Pattern from social-dashboard/src/lib/airtable.ts
 */

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

/** Get the latest trend report. */
export async function getLatestTrendReport() {
  const records = await fetchRecords(TABLES.TREND_REPORTS, {
    sort: [{ field: "Report Date", direction: "desc" }],
    maxRecords: 1,
  });
  return records[0]?.fields ?? null;
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
