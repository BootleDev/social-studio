import { NextResponse } from "next/server";
import { getIntelligenceContext } from "@/lib/airtable";
import { requireAuth } from "@/lib/requireAuth";

// Pin the Node.js runtime: getIntelligenceContext() -> Supabase uses node-pg,
// which cannot run on the Edge runtime.
export const runtime = "nodejs";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const context = await getIntelligenceContext();
    return NextResponse.json(context);
  } catch (error) {
    console.error("[Intelligence] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch intelligence data" },
      { status: 500 },
    );
  }
}
