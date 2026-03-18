import { NextResponse } from "next/server";
import {
  getContainerStatus,
  publishIGContainer,
  isValidMetaId,
} from "@/lib/meta";
import { requireAuth } from "@/lib/requireAuth";

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: { containerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!body.containerId || !isValidMetaId(body.containerId)) {
    return NextResponse.json(
      { error: "Invalid containerId" },
      { status: 400 },
    );
  }

  try {
    // Preflight status check
    const { status, errorMessage } = await getContainerStatus(body.containerId);

    if (status === "PUBLISHED") {
      return NextResponse.json({
        success: true,
        mediaId: body.containerId,
        note: "Already published",
      });
    }

    if (status === "EXPIRED") {
      return NextResponse.json(
        { success: false, error: "Container expired. Re-upload and try again." },
        { status: 422 },
      );
    }

    if (status === "ERROR") {
      return NextResponse.json(
        { success: false, error: errorMessage || "Container processing failed" },
        { status: 422 },
      );
    }

    if (status !== "FINISHED") {
      return NextResponse.json(
        { success: false, error: `Container not ready (status: ${status})` },
        { status: 409 },
      );
    }

    const result = await publishIGContainer(body.containerId);
    return NextResponse.json({ success: true, mediaId: result.mediaId });
  } catch (error) {
    console.error("[Finalise] Error:", error);
    return NextResponse.json(
      { success: false, error: "Publish failed" },
      { status: 500 },
    );
  }
}
