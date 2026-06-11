/**
 * Locks the HMAC session-token scheme shared with ad-dashboard and
 * social-dashboard (WEBDEV-211 lineage): the token MUST be unforgeable
 * without the password and verified in constant time, failing closed on
 * every empty/short/tampered input. Ported from ad-dashboard's auth.test.ts
 * (WEBDEV-215).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { createAuthToken, verifyAuthToken, checkRateLimit } from "../auth";

afterEach(() => {
  vi.useRealTimers();
});

describe("createAuthToken / verifyAuthToken", () => {
  it("is deterministic for a given password (64 hex chars = SHA-256)", async () => {
    const a = await createAuthToken("hunter2");
    const b = await createAuthToken("hunter2");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different passwords", async () => {
    expect(await createAuthToken("a")).not.toBe(await createAuthToken("b"));
  });

  it("verifies a token minted from the same password", async () => {
    const token = await createAuthToken("s3cret");
    expect(await verifyAuthToken(token, "s3cret")).toBe(true);
  });

  it('REJECTS a guessable literal ("authenticated") — forgery guard', async () => {
    expect(await verifyAuthToken("authenticated", "s3cret")).toBe(false);
  });

  it("rejects a token minted from a different password", async () => {
    const token = await createAuthToken("old-password");
    expect(await verifyAuthToken(token, "new-password")).toBe(false);
  });

  it("rejects empty token or empty password (fail closed)", async () => {
    const token = await createAuthToken("s3cret");
    expect(await verifyAuthToken("", "s3cret")).toBe(false);
    expect(await verifyAuthToken(token, "")).toBe(false);
    expect(await verifyAuthToken("", "")).toBe(false);
  });

  it("rejects a token of the wrong length without throwing (length guard before compare)", async () => {
    expect(await verifyAuthToken("abc", "s3cret")).toBe(false);
  });

  it("rejects a single-hex-digit tampered token of the correct length", async () => {
    const token = await createAuthToken("s3cret");
    const flipped = (token[0] === "0" ? "1" : "0") + token.slice(1);
    expect(flipped).toHaveLength(token.length);
    expect(await verifyAuthToken(flipped, "s3cret")).toBe(false);
  });

  it('pins the signing context "bootle_social_studio_v1" (per-app domain separation)', async () => {
    // The signing context domain-separates this app's cookie: a leaked token
    // from a sibling dashboard (same password, different context) must not
    // authenticate here. Recompute the expected HMAC independently with
    // node:crypto — if the context string or algorithm ever changes, this
    // fails and forces a deliberate decision (it also invalidates live
    // sessions).
    const { createHmac } = await import("node:crypto");
    const expected = createHmac("sha256", "s3cret")
      .update("bootle_social_studio_v1")
      .digest("hex");
    expect(await createAuthToken("s3cret")).toBe(expected);
  });
});

describe("checkRateLimit", () => {
  it("allows up to maxAttempts then blocks within the window (unique IP per test)", () => {
    const ip = "10.0.0.1";
    for (let i = 0; i < 5; i++)
      expect(checkRateLimit(ip, 5, 60_000)).toBe(true);
    expect(checkRateLimit(ip, 5, 60_000)).toBe(false);
  });

  it("tracks IPs independently", () => {
    expect(checkRateLimit("10.0.0.2", 1, 60_000)).toBe(true);
    expect(checkRateLimit("10.0.0.2", 1, 60_000)).toBe(false);
    expect(checkRateLimit("10.0.0.3", 1, 60_000)).toBe(true);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    const ip = "10.0.0.4";
    expect(checkRateLimit(ip, 1, 60_000)).toBe(true);
    expect(checkRateLimit(ip, 1, 60_000)).toBe(false); // blocked within window
    vi.advanceTimersByTime(60_001); // window elapses
    expect(checkRateLimit(ip, 1, 60_000)).toBe(true); // allowed again
  });
});
