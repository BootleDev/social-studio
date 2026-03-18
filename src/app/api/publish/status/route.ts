import { NextResponse } from "next/server";
import { getContainerStatus, isValidMetaId } from "@/lib/meta";
import { requireAuth } from "@/lib/requireAuth";

export async function GET(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const containerId = searchParams.get("containerId");

  if (!containerId || !isValidMetaId(containerId)) {
    return NextResponse.json(
      { error: "Invalid containerId" },
      { status: 400 },
    );
  }

  try {
    const result = await getContainerStatus(containerId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Status] Error:", error);
    return NextResponse.json(
      { error: "Status check failed" },
      { status: 500 },
    );
  }
}
