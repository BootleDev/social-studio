import { NextResponse } from "next/server";
import {
  publishToFacebook,
  startInstagramPublish,
  type PostType,
  type PublishResult,
} from "@/lib/meta";
import { requireAuth } from "@/lib/requireAuth";

const VALID_POST_TYPES = ["image", "carousel", "reel"];
const ALLOWED_BLOB_HOST = "public.blob.vercel-storage.com";
const MAX_CAPTION_LENGTH = 5000;

function isAllowedMediaUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(ALLOWED_BLOB_HOST);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // Defence-in-depth auth
  const authError = await requireAuth();
  if (authError) return authError;

  let body: {
    mediaUrls?: string[];
    captionIG?: string;
    captionFB?: string;
    postType?: string;
    platforms?: { instagram?: boolean; facebook?: boolean };
    hashtags?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { mediaUrls, captionIG, captionFB, postType, platforms, hashtags } =
    body;

  // Validate at least one platform selected
  if (!platforms?.instagram && !platforms?.facebook) {
    return NextResponse.json(
      { error: "Select at least one platform" },
      { status: 400 },
    );
  }

  if (!mediaUrls || mediaUrls.length === 0) {
    return NextResponse.json(
      { error: "No media URLs provided" },
      { status: 400 },
    );
  }

  // Validate media URLs are from our Blob storage
  if (!mediaUrls.every(isAllowedMediaUrl)) {
    return NextResponse.json(
      { error: "Invalid media URL" },
      { status: 400 },
    );
  }

  if (!VALID_POST_TYPES.includes(postType || "")) {
    return NextResponse.json(
      { error: "Invalid postType" },
      { status: 400 },
    );
  }

  // Input length limits
  if ((captionIG?.length ?? 0) > MAX_CAPTION_LENGTH) {
    return NextResponse.json(
      { error: "Instagram caption too long" },
      { status: 400 },
    );
  }
  if ((captionFB?.length ?? 0) > MAX_CAPTION_LENGTH) {
    return NextResponse.json(
      { error: "Facebook caption too long" },
      { status: 400 },
    );
  }

  // Build captions
  const igCaption = captionIG
    ? hashtags && hashtags.length > 0
      ? `${captionIG}\n\n${hashtags.join(" ")}`
      : captionIG
    : "";

  const fbCaption = captionFB || captionIG || "";

  // Publish to platforms immutably
  const [igResult, fbResult] = await Promise.all([
    platforms?.instagram
      ? startInstagramPublish(mediaUrls, igCaption, postType as PostType)
      : Promise.resolve(null),
    platforms?.facebook
      ? publishToFacebook(mediaUrls, fbCaption, postType as PostType)
      : Promise.resolve(null),
  ]);

  const result: PublishResult = {
    ...(igResult ? { instagram: igResult } : {}),
    ...(fbResult ? { facebook: fbResult } : {}),
  };

  return NextResponse.json(result);
}
