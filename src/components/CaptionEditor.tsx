"use client";

import { validateCaption } from "@/lib/voice";

interface CaptionEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  postType: string;
}

export function CaptionEditor({
  label,
  value,
  onChange,
  maxLength,
  postType,
}: CaptionEditorProps) {
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const validation = value.length > 10 ? validateCaption(value) : null;

  // Platform-specific guidance
  const guidance =
    postType === "reel"
      ? "1-2 lines only. Hook-first."
      : "Hook → Body (1-3 sentences) → CTA. 100-200 words.";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        <span
          className="text-xs"
          style={{
            color:
              charCount > maxLength
                ? "var(--accent-red)"
                : "var(--text-secondary)",
          }}
        >
          {charCount}/{maxLength} chars | {wordCount} words
        </span>
      </div>

      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {guidance}
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={postType === "reel" ? 3 : 6}
        className="w-full px-3 py-2 rounded-lg text-sm resize-y"
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${validation && validation.issues.length > 0 ? "var(--accent-amber)" : "var(--border)"}`,
          color: "var(--text-primary)",
        }}
        placeholder={
          postType === "reel"
            ? "one bottle, three secrets inside"
            : "Your hook line goes here..."
        }
      />

      {/* Inline validation warnings */}
      {validation && validation.issues.length > 0 && (
        <div className="space-y-1">
          {validation.issues.slice(0, 3).map((issue, i) => (
            <p
              key={i}
              className="text-xs"
              style={{ color: "var(--accent-amber)" }}
            >
              {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
