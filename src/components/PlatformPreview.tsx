"use client";

interface PlatformPreviewProps {
  captionIG: string;
  captionFB: string;
  hashtags: string[];
  mediaUrls: string[];
  platforms: { instagram: boolean; facebook: boolean };
  postType: string;
}

export function PlatformPreview({
  captionIG,
  captionFB,
  hashtags,
  mediaUrls,
  platforms,
  postType,
}: PlatformPreviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Instagram Preview */}
      {platforms.instagram && (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="px-3 py-2 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full"
              style={{ background: "var(--accent-purple)" }}
            />
            <span className="text-sm font-medium">bootleofficial</span>
          </div>

          {/* Media placeholder */}
          <div
            className="aspect-square flex items-center justify-center"
            style={{ background: "var(--bg-secondary)" }}
          >
            {mediaUrls.length > 0 ? (
              mediaUrls[0].match(/\.(mp4|mov)$/i) ? (
                <video
                  src={mediaUrls[0]}
                  className="w-full h-full object-cover"
                  muted
                  controls
                />
              ) : (
                <img
                  src={mediaUrls[0]}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {postType === "reel" ? "Video" : "Image"} preview
              </p>
            )}
          </div>

          {/* Caption */}
          <div className="p-3">
            <p className="text-sm">
              <span className="font-medium">bootleofficial </span>
              {captionIG}
            </p>
            {hashtags.length > 0 && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--accent-blue)" }}
              >
                {hashtags.join(" ")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Facebook Preview */}
      {platforms.facebook && (
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="px-3 py-2 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full"
              style={{ background: "var(--accent-blue)" }}
            />
            <span className="text-sm font-medium">Bootle</span>
          </div>

          {/* Caption first on Facebook */}
          <div className="px-3 pb-2">
            <p className="text-sm">{captionFB || captionIG}</p>
          </div>

          {/* Media */}
          <div
            className="aspect-video flex items-center justify-center"
            style={{ background: "var(--bg-secondary)" }}
          >
            {mediaUrls.length > 0 ? (
              mediaUrls[0].match(/\.(mp4|mov)$/i) ? (
                <video
                  src={mediaUrls[0]}
                  className="w-full h-full object-cover"
                  muted
                  controls
                />
              ) : (
                <img
                  src={mediaUrls[0]}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Media preview
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
