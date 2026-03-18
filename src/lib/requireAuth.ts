/**
 * Defence-in-depth auth check for API routes.
 * Returns a 401 Response if unauthorized, null if authorized.
 */

import { cookies } from "next/headers";
import { verifyAuthToken } from "./auth";
import { NextResponse } from "next/server";

export async function requireAuth(): Promise<NextResponse | null> {
  const password = process.env.STUDIO_PASSWORD;
  if (!password) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("bootle_studio_auth")?.value ?? "";
  const valid = await verifyAuthToken(token, password);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
