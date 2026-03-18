"use client";

import { useState, useCallback, useRef } from "react";
import { upload } from "@vercel/blob/client";

interface MediaUploaderProps {
  mediaUrls: string[];
  postType: string;
  onUpload: (url: string) => void;
  onRemove: (index: number) => void;
  accept: string;
}

export function MediaUploader({
  mediaUrls,
  postType,
  onUpload,
  onRemove,
  accept,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setError("");
      setUploading(true);

      try {
        for (const file of Array.from(files)) {
          // Validate file type
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (!["jpg", "jpeg", "png", "mp4", "mov"].includes(ext || "")) {
            setError(`Invalid file type: .${ext}`);
            continue;
          }

          // Validate size
          if (file.size > 500 * 1024 * 1024) {
            setError("File too large (max 500MB)");
            continue;
          }

          // Upload via Vercel Blob client
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });

          onUpload(blob.url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0 && fileInputRef.current) {
        const dt = new DataTransfer();
        // Only take first file for image/reel; all files for carousel
        const filesToAdd =
          postType === "carousel" ? Array.from(files) : [files[0]];
        filesToAdd.forEach((f) => dt.items.add(f));
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(
          new Event("change", { bubbles: true }),
        );
      }
    },
    [postType],
  );

  const maxFiles = postType === "carousel" ? 10 : 1;
  const canUploadMore = mediaUrls.length < maxFiles;

  return (
    <div className="space-y-3">
      {/* Upload area */}
      {canUploadMore && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{
            background: "var(--bg-card)",
            border: "2px dashed var(--border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {uploading
              ? "Uploading..."
              : `Drop ${postType === "reel" ? "video" : "image(s)"} here or click to browse`}
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {postType === "carousel"
              ? `${mediaUrls.length}/${maxFiles} images`
              : postType === "reel"
                ? "MP4 or MOV, max 500MB"
                : "JPEG or PNG, max 100MB"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={postType === "carousel"}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm" style={{ color: "var(--accent-red)" }}>
          {error}
        </p>
      )}

      {/* Media thumbnails */}
      {mediaUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {mediaUrls.map((url, i) => (
            <div
              key={url}
              className="relative w-20 h-20 rounded-lg overflow-hidden group"
              style={{ border: "1px solid var(--border)" }}
            >
              {url.match(/\.(mp4|mov)$/i) ? (
                <video src={url} className="w-full h-full object-cover" muted />
              ) : (
                <img
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "var(--accent-red)",
                  color: "#fff",
                }}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
