"use client";

import { useState, useCallback } from "react";

interface PublishBarProps {
  mediaUrls: string[];
  captionIG: string;
  captionFB: string;
  hashtags: string[];
  postType: string;
  platforms: { instagram: boolean; facebook: boolean };
}

type PublishState = "idle" | "publishing" | "polling" | "success" | "error";

export function PublishBar({
  mediaUrls,
  captionIG,
  captionFB,
  hashtags,
  postType,
  platforms,
}: PublishBarProps) {
  const [state, setState] = useState<PublishState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const canPublish =
    mediaUrls.length > 0 &&
    (captionIG || captionFB) &&
    (platforms.instagram || platforms.facebook);

  const pollReelStatus = useCallback(
    async (containerId: string): Promise<boolean> => {
      const maxAttempts = 30;
      for (let i = 0; i < maxAttempts; i++) {
        const res = await fetch(
          `/api/publish/status?containerId=${containerId}`,
        );

        if (!res.ok) {
          throw new Error(`Status check failed (${res.status})`);
        }

        const data = await res.json();

        if (data.status === "FINISHED" || data.status === "PUBLISHED") {
          return true;
        }
        if (data.status === "ERROR") {
          throw new Error(data.errorMessage || "Reel processing failed");
        }
        if (data.status === "EXPIRED") {
          throw new Error("Reel expired. Please re-upload and try again.");
        }

        setStatusMessage(`Processing Reel... (${i + 1}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      throw new Error("Reel processing timed out");
    },
    [],
  );

  const handlePublish = useCallback(async () => {
    setState("publishing");
    setStatusMessage("Publishing...");

    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrls,
          captionIG,
          captionFB: captionFB || captionIG,
          postType,
          platforms,
          hashtags,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Publish failed");
      }

      const result = await res.json();

      // Handle Reel polling for Instagram
      if (
        result.instagram?.containerId &&
        result.instagram?.status === "IN_PROGRESS"
      ) {
        setState("polling");
        await pollReelStatus(result.instagram.containerId);

        // Finalise the Reel
        const finalRes = await fetch("/api/publish/finalise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            containerId: result.instagram.containerId,
          }),
        });
        const finalData = await finalRes.json();
        if (!finalData.success) {
          throw new Error(finalData.error || "Failed to finalise Reel");
        }
      }

      // Check results
      const igOk = !platforms.instagram || result.instagram?.success;
      const fbOk = !platforms.facebook || result.facebook?.success;

      if (igOk && fbOk) {
        setState("success");
        setStatusMessage("Published successfully.");
      } else {
        const errors: string[] = [];
        if (result.instagram?.error)
          errors.push(`IG: ${result.instagram.error}`);
        if (result.facebook?.error) errors.push(`FB: ${result.facebook.error}`);
        setState("error");
        setStatusMessage(errors.join(" | "));
      }
    } catch (err) {
      setState("error");
      setStatusMessage(err instanceof Error ? err.message : "Publish failed");
    }
  }, [
    mediaUrls,
    captionIG,
    captionFB,
    postType,
    platforms,
    hashtags,
    pollReelStatus,
  ]);

  return (
    <div
      className="flex items-center justify-between p-4 rounded-lg"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Status message */}
      <div className="flex-1">
        {statusMessage && (
          <p
            className="text-sm"
            style={{
              color:
                state === "success"
                  ? "var(--accent-green)"
                  : state === "error"
                    ? "var(--accent-red)"
                    : "var(--text-secondary)",
            }}
          >
            {statusMessage}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handlePublish}
          disabled={
            !canPublish || state === "publishing" || state === "polling"
          }
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity"
          style={{
            background:
              canPublish && state !== "publishing" && state !== "polling"
                ? "var(--accent-green)"
                : "var(--border)",
            color: "#fff",
            opacity: state === "publishing" || state === "polling" ? 0.6 : 1,
          }}
        >
          {state === "publishing"
            ? "Publishing..."
            : state === "polling"
              ? "Processing..."
              : "Publish Now"}
        </button>
      </div>
    </div>
  );
}
