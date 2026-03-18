"use client";

import { useState, useCallback } from "react";
import { MediaUploader } from "./MediaUploader";
import { CaptionEditor } from "./CaptionEditor";
import { HashtagPicker } from "./HashtagPicker";
import { PlatformPreview } from "./PlatformPreview";
import { PublishBar } from "./PublishBar";
import { BrandScorecard } from "./BrandScorecard";
import type { HashtagSet } from "@/lib/hashtags";

type PostType = "image" | "carousel" | "reel";

interface ComposerProps {
  onAIGenerate: (params: {
    draftCaption?: string;
    postType: string;
    platforms: { instagram: boolean; facebook: boolean };
    mediaDescription?: string;
    lastUsedSet?: string;
  }) => Promise<Record<string, unknown>>;
  aiResult: Record<string, unknown> | null;
  aiLoading: boolean;
}

export function Composer({ onAIGenerate, aiResult, aiLoading }: ComposerProps) {
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostType>("image");
  const [platforms, setPlatforms] = useState({
    instagram: true,
    facebook: true,
  });
  const [captionIG, setCaptionIG] = useState("");
  const [captionFB, setCaptionFB] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagSet, setHashtagSet] = useState<HashtagSet | undefined>();
  const [mediaDescription, setMediaDescription] = useState("");
  const [lastUsedSet, setLastUsedSet] = useState<HashtagSet | undefined>();
  const [showPreview, setShowPreview] = useState(false);

  const handleMediaUpload = useCallback((url: string) => {
    setMediaUrls((prev) => [...prev, url]);
  }, []);

  const handleMediaRemove = useCallback((index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAIEnhance = useCallback(async () => {
    try {
      const result = await onAIGenerate({
        draftCaption: captionIG || undefined,
        postType,
        platforms,
        mediaDescription: mediaDescription || undefined,
        lastUsedSet,
      });

      // Apply AI results
      const ig = result.instagram as Record<string, unknown> | undefined;
      const fb = result.facebook as Record<string, unknown> | undefined;

      if (ig) {
        setCaptionIG(ig.caption as string);
        setHashtags(ig.hashtags as string[]);
        setHashtagSet(ig.hashtagSet as HashtagSet);
        setLastUsedSet(ig.hashtagSet as HashtagSet);
      }
      if (fb) {
        setCaptionFB(fb.caption as string);
      }
    } catch {
      // Error already logged in parent
    }
  }, [
    captionIG,
    postType,
    platforms,
    mediaDescription,
    lastUsedSet,
    onAIGenerate,
  ]);

  // Determine post type from media
  const effectivePostType = mediaUrls.length > 1 ? "carousel" : postType;

  return (
    <div className="space-y-6">
      {/* Post Type Selector */}
      <div className="flex gap-2">
        {(["image", "carousel", "reel"] as PostType[]).map((type) => (
          <button
            key={type}
            onClick={() => setPostType(type)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background:
                postType === type ? "var(--accent-blue)" : "var(--bg-card)",
              color: postType === type ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${postType === type ? "var(--accent-blue)" : "var(--border)"}`,
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Platform Toggles */}
      <div className="flex gap-3">
        {(["instagram", "facebook"] as const).map((p) => (
          <label key={p} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={platforms[p]}
              onChange={() =>
                setPlatforms((prev) => ({ ...prev, [p]: !prev[p] }))
              }
              className="rounded"
            />
            <span className="text-sm">
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </span>
          </label>
        ))}
      </div>

      {/* Media Upload */}
      <MediaUploader
        mediaUrls={mediaUrls}
        postType={effectivePostType}
        onUpload={handleMediaUpload}
        onRemove={handleMediaRemove}
        accept={postType === "reel" ? "video/*" : "image/*"}
      />

      {/* Media Description (for AI context) */}
      <div>
        <label
          htmlFor="media-desc"
          className="block text-xs mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Describe the media (helps AI generate better captions)
        </label>
        <input
          id="media-desc"
          type="text"
          value={mediaDescription}
          onChange={(e) => setMediaDescription(e.target.value)}
          placeholder="e.g. Close-up of glass Bootle with fruit infusion in morning light"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Caption Editors */}
      {platforms.instagram ? (
        <CaptionEditor
          label="Instagram Caption"
          value={captionIG}
          onChange={setCaptionIG}
          maxLength={2200}
          postType={effectivePostType}
        />
      ) : null}

      {platforms.facebook ? (
        <CaptionEditor
          label="Facebook Caption"
          value={captionFB}
          onChange={setCaptionFB}
          maxLength={63206}
          postType={effectivePostType}
        />
      ) : null}

      {/* Hashtag Picker */}
      {platforms.instagram ? (
        <HashtagPicker
          hashtags={hashtags}
          onChange={setHashtags}
          currentSet={hashtagSet}
        />
      ) : null}

      {/* AI Enhance Button */}
      <button
        onClick={handleAIEnhance}
        disabled={aiLoading}
        className="w-full py-3 rounded-lg text-sm font-medium transition-opacity disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: "var(--accent-purple)",
          color: "#fff",
          opacity: aiLoading ? 0.6 : 1,
        }}
      >
        {aiLoading ? "Generating..." : "AI Enhance"}
      </button>

      {/* Brand Scorecard */}
      {aiResult?.instagram ? (
        <BrandScorecard
          result={aiResult.instagram as Record<string, unknown>}
        />
      ) : null}

      {/* Preview Toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="text-sm underline cursor-pointer"
        style={{ color: "var(--accent-blue)" }}
      >
        {showPreview ? "Hide Preview" : "Show Preview"}
      </button>

      {showPreview ? (
        <PlatformPreview
          captionIG={captionIG}
          captionFB={captionFB}
          hashtags={hashtags}
          mediaUrls={mediaUrls}
          platforms={platforms}
          postType={effectivePostType}
        />
      ) : null}

      {/* Publish Bar */}
      <PublishBar
        mediaUrls={mediaUrls}
        captionIG={captionIG}
        captionFB={captionFB}
        hashtags={hashtags}
        postType={effectivePostType}
        platforms={platforms}
      />
    </div>
  );
}
