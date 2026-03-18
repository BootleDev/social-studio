/**
 * Meta Graph API integration for Instagram + Facebook publishing.
 * Reference: marketing/paid-ads/meta_api.py (ported to TypeScript)
 *
 * Fixes applied from audit:
 * - #1: Carousel child containers polled before publish
 * - #2: Container status handles PUBLISHED/EXPIRED correctly
 * - #3: FB uses Page Access Token (fetched via /me/accounts)
 * - #4: FB Reels use /video_reels endpoint
 * - #7: Meta token moved to Authorization header for GETs
 * - #9: containerId validation helper
 * - #11: Meta error responses parsed as structured JSON
 */

const META_API_VERSION = process.env.META_API_VERSION || "v22.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function getConfig() {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  const igUserId = process.env.META_IG_USER_ID;
  if (!token || !pageId || !igUserId) {
    throw new Error("Missing Meta API credentials");
  }
  return { token, pageId, igUserId };
}

/** Validate a Meta container/media ID is numeric. */
export function isValidMetaId(id: string): boolean {
  return /^\d{5,25}$/.test(id);
}

interface MetaErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    fbtrace_id?: string;
  };
}

function parseMetaError(status: number, body: string): Error {
  try {
    const parsed: MetaErrorResponse = JSON.parse(body);
    if (parsed.error) {
      return new Error(
        `Meta API error ${status} (code ${parsed.error.code ?? "unknown"}): ${parsed.error.message ?? body}`,
      );
    }
  } catch {
    // Not JSON — fall through
  }
  return new Error(`Meta API error ${status}`);
}

async function metaPost(
  endpoint: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const { token } = getConfig();
  const body = new URLSearchParams({ ...params, access_token: token });

  const res = await fetch(`${META_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw parseMetaError(res.status, err);
  }

  return res.json();
}

async function metaGet(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const { token } = getConfig();
  const searchParams = new URLSearchParams(params);

  const res = await fetch(`${META_BASE}${endpoint}?${searchParams}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw parseMetaError(res.status, err);
  }

  return res.json();
}

// ─── Page Access Token ─────────────────────────────────────────

let _pageAccessToken: string | null = null;

/**
 * Fetch Page Access Token from system user token via /me/accounts.
 * Cached in memory for the lifetime of the serverless instance.
 */
async function getPageAccessToken(): Promise<string> {
  if (_pageAccessToken) return _pageAccessToken;

  const { token, pageId } = getConfig();
  const res = await fetch(
    `${META_BASE}/me/accounts?access_token=${encodeURIComponent(token)}`,
  );

  if (!res.ok) {
    const err = await res.text();
    throw parseMetaError(res.status, err);
  }

  const data = await res.json();
  const pages = data.data as Array<{ id: string; access_token: string }>;
  const page = pages?.find((p) => p.id === pageId);

  if (!page?.access_token) {
    throw new Error(
      `No Page Access Token found for page ${pageId}. Ensure the system user has page permissions.`,
    );
  }

  _pageAccessToken = page.access_token;
  return _pageAccessToken;
}

async function metaPostAsPage(
  endpoint: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const pageToken = await getPageAccessToken();
  const body = new URLSearchParams({ ...params, access_token: pageToken });

  const res = await fetch(`${META_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw parseMetaError(res.status, err);
  }

  return res.json();
}

// ─── Facebook Publishing ───────────────────────────────────────

export async function publishFacebookPhoto(
  imageUrl: string,
  caption: string,
): Promise<{ id: string }> {
  const { pageId } = getConfig();
  const result = await metaPostAsPage(`/${pageId}/photos`, {
    url: imageUrl,
    message: caption,
  });
  return { id: String(result.id) };
}

export async function publishFacebookCarousel(
  imageUrls: string[],
  caption: string,
): Promise<{ id: string }> {
  const { pageId } = getConfig();

  const photoIds: string[] = [];
  for (const url of imageUrls) {
    const result = await metaPostAsPage(`/${pageId}/photos`, {
      url,
      published: "false",
    });
    photoIds.push(String(result.id));
  }

  const params: Record<string, string> = { message: caption };
  photoIds.forEach((id, i) => {
    params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
  });

  const result = await metaPostAsPage(`/${pageId}/feed`, params);
  return { id: String(result.id) };
}

export async function publishFacebookVideo(
  videoUrl: string,
  caption: string,
  isReel: boolean,
): Promise<{ id: string }> {
  const { pageId } = getConfig();
  const endpoint = isReel ? `/${pageId}/video_reels` : `/${pageId}/videos`;
  const result = await metaPostAsPage(endpoint, {
    file_url: videoUrl,
    description: caption,
  });
  return { id: String(result.id) };
}

// ─── Instagram Publishing ──────────────────────────────────────

export async function createIGImageContainer(
  imageUrl: string,
  caption: string,
): Promise<{ containerId: string }> {
  const { igUserId } = getConfig();
  const result = await metaPost(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
  });
  return { containerId: String(result.id) };
}

export async function createIGReelContainer(
  videoUrl: string,
  caption: string,
): Promise<{ containerId: string }> {
  const { igUserId } = getConfig();
  const result = await metaPost(`/${igUserId}/media`, {
    video_url: videoUrl,
    caption,
    media_type: "REELS",
    share_to_feed: "true",
  });
  return { containerId: String(result.id) };
}

export async function createIGCarouselItemContainer(
  imageUrl: string,
): Promise<{ containerId: string }> {
  const { igUserId } = getConfig();
  const result = await metaPost(`/${igUserId}/media`, {
    image_url: imageUrl,
    is_carousel_item: "true",
  });
  return { containerId: String(result.id) };
}

export async function createIGCarouselContainer(
  childIds: string[],
  caption: string,
): Promise<{ containerId: string }> {
  const { igUserId } = getConfig();
  const result = await metaPost(`/${igUserId}/media`, {
    media_type: "CAROUSEL_ALBUM",
    children: childIds.join(","),
    caption,
  });
  return { containerId: String(result.id) };
}

export type ContainerStatus =
  | "IN_PROGRESS"
  | "FINISHED"
  | "ERROR"
  | "PUBLISHED"
  | "EXPIRED";

export async function getContainerStatus(
  containerId: string,
): Promise<{ status: ContainerStatus; errorMessage?: string }> {
  const result = await metaGet(`/${containerId}`, {
    fields: "status_code",
  });

  const statusCode = String(result.status_code || "IN_PROGRESS");

  // Normalise known terminal states
  const validStatuses: ContainerStatus[] = [
    "IN_PROGRESS",
    "FINISHED",
    "ERROR",
    "PUBLISHED",
    "EXPIRED",
  ];
  const status: ContainerStatus = validStatuses.includes(
    statusCode as ContainerStatus,
  )
    ? (statusCode as ContainerStatus)
    : "IN_PROGRESS";

  // Fetch error details if ERROR
  let errorMessage: string | undefined;
  if (status === "ERROR") {
    const detail = await metaGet(`/${containerId}`, {
      fields: "status",
    });
    errorMessage = String(detail.status ?? "Unknown error");
  }

  return { status, errorMessage };
}

export async function publishIGContainer(
  containerId: string,
): Promise<{ mediaId: string }> {
  const { igUserId } = getConfig();
  const result = await metaPost(`/${igUserId}/media_publish`, {
    creation_id: containerId,
  });
  return { mediaId: String(result.id) };
}

/**
 * Poll a container until FINISHED, PUBLISHED, ERROR, or EXPIRED.
 * Used for Reels and carousel containers.
 */
async function pollContainerUntilReady(
  containerId: string,
  maxAttempts = 30,
  intervalMs = 3000,
): Promise<ContainerStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const { status, errorMessage } = await getContainerStatus(containerId);

    if (status === "FINISHED" || status === "PUBLISHED") {
      return status;
    }
    if (status === "ERROR") {
      throw new Error(`Container processing failed: ${errorMessage ?? "unknown error"}`);
    }
    if (status === "EXPIRED") {
      throw new Error("Container expired. Please re-upload and try again.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Container processing timed out");
}

// ─── High-Level Publish Orchestrators ──────────────────────────

export type PostType = "image" | "carousel" | "reel";

export interface PublishResult {
  instagram?: {
    success: boolean;
    mediaId?: string;
    containerId?: string;
    status?: ContainerStatus;
    error?: string;
  };
  facebook?: {
    success: boolean;
    postId?: string;
    error?: string;
  };
}

export async function publishToFacebook(
  mediaUrls: string[],
  caption: string,
  postType: PostType,
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    if (postType === "reel") {
      const result = await publishFacebookVideo(mediaUrls[0], caption, true);
      return { success: true, postId: result.id };
    }
    if (postType === "carousel" && mediaUrls.length > 1) {
      const result = await publishFacebookCarousel(mediaUrls, caption);
      return { success: true, postId: result.id };
    }
    if (postType === "carousel" && mediaUrls.length <= 1) {
      return { success: false, error: "Carousel requires at least 2 images" };
    }
    const result = await publishFacebookPhoto(mediaUrls[0], caption);
    return { success: true, postId: result.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Start Instagram publish.
 * For Reels: returns containerId for client-side polling.
 * For carousels: polls child containers server-side, then returns containerId for album polling.
 * For images: completes immediately.
 */
export async function startInstagramPublish(
  mediaUrls: string[],
  caption: string,
  postType: PostType,
): Promise<{
  success: boolean;
  mediaId?: string;
  containerId?: string;
  status?: ContainerStatus;
  error?: string;
}> {
  try {
    if (postType === "reel") {
      const { containerId } = await createIGReelContainer(
        mediaUrls[0],
        caption,
      );
      return { success: true, containerId, status: "IN_PROGRESS" };
    }

    if (postType === "carousel") {
      if (mediaUrls.length < 2) {
        return { success: false, error: "Carousel requires at least 2 images" };
      }

      // Create child containers
      const childIds: string[] = [];
      for (const url of mediaUrls) {
        const { containerId } = await createIGCarouselItemContainer(url);
        childIds.push(containerId);
      }

      // Poll each child container until ready
      for (const childId of childIds) {
        await pollContainerUntilReady(childId, 20, 2000);
      }

      // Create album container
      const { containerId } = await createIGCarouselContainer(
        childIds,
        caption,
      );

      // Poll album container
      await pollContainerUntilReady(containerId, 20, 2000);

      // Publish
      const { mediaId } = await publishIGContainer(containerId);
      return { success: true, mediaId, status: "FINISHED" };
    }

    // Single image
    const { containerId } = await createIGImageContainer(
      mediaUrls[0],
      caption,
    );
    // Images are usually immediate, but poll to be safe
    await pollContainerUntilReady(containerId, 10, 1000);
    const { mediaId } = await publishIGContainer(containerId);
    return { success: true, mediaId, status: "FINISHED" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
