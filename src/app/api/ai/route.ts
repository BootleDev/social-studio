import { NextResponse } from "next/server";
import { generateCaption, type AIGenerateInput } from "@/lib/ai";
import { getIntelligenceContext } from "@/lib/airtable";
import { requireAuth } from "@/lib/requireAuth";
import type { HashtagSet } from "@/lib/hashtags";

const VALID_POST_TYPES = ["image", "carousel", "reel"];
const VALID_SETS: HashtagSet[] = ["A", "B", "C", "D", "E", "F"];
const MAX_INPUT_LENGTH = 5000;

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: {
    draftCaption?: string;
    postType?: string;
    platforms?: { instagram?: boolean; facebook?: boolean };
    mediaDescription?: string;
    lastUsedSet?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const postType = body.postType as "image" | "carousel" | "reel";
  if (!VALID_POST_TYPES.includes(postType)) {
    return NextResponse.json(
      { error: "Invalid postType" },
      { status: 400 },
    );
  }

  // Input length limits
  if ((body.draftCaption?.length ?? 0) > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: "Draft caption too long" },
      { status: 400 },
    );
  }
  if ((body.mediaDescription?.length ?? 0) > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: "Media description too long" },
      { status: 400 },
    );
  }

  const platforms = {
    instagram: body.platforms?.instagram ?? true,
    facebook: body.platforms?.facebook ?? true,
  };

  if (!platforms.instagram && !platforms.facebook) {
    return NextResponse.json(
      { error: "Select at least one platform" },
      { status: 400 },
    );
  }

  // Validate lastUsedSet
  const lastUsedSet = VALID_SETS.includes(body.lastUsedSet as HashtagSet)
    ? (body.lastUsedSet as HashtagSet)
    : undefined;

  try {
    const context = await getIntelligenceContext();

    const input: AIGenerateInput = {
      draftCaption: body.draftCaption,
      postType,
      platforms,
      mediaDescription: body.mediaDescription,
      trendReport: context.trendReport,
      recentPosts: context.recentPosts,
      creativeBriefs: context.creativeBriefs,
      topCompetitorContent: context.topCompetitorContent,
      lastUsedSet,
    };

    const result = await generateCaption(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI] Error:", error);
    return NextResponse.json(
      { error: "AI generation temporarily unavailable" },
      { status: 500 },
    );
  }
}
