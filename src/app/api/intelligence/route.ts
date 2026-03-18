import { NextResponse } from "next/server";
import { getIntelligenceContext } from "@/lib/airtable";
import { requireAuth } from "@/lib/requireAuth";

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
