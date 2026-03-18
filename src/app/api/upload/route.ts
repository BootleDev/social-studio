import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth } from "@/lib/requireAuth";

/**
 * Handles Vercel Blob client-side upload token handshake.
 * The browser uploads directly to Blob storage — this route
 * only generates signed tokens, never receives file bytes.
 */
export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type
        const ext = pathname.split(".").pop()?.toLowerCase();
        const allowed = ["jpg", "jpeg", "png", "mp4", "mov"];
        if (!ext || !allowed.includes(ext)) {
          throw new Error(
            `Invalid file type: .${ext}. Allowed: ${allowed.join(", ")}`,
          );
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "video/mp4",
            "video/quicktime",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB for video
          tokenPayload: JSON.stringify({
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Log successful uploads (server-side only)
        console.log("[Upload] Complete:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
