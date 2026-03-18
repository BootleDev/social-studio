"use client";

import { useState } from "react";
import {
  ROTATION_SETS,
  BRANDED_TAGS,
  getSeasonalContext,
  type HashtagSet,
} from "@/lib/hashtags";

interface HashtagPickerProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
  currentSet?: HashtagSet;
}

export function HashtagPicker({
  hashtags,
  onChange,
  currentSet,
}: HashtagPickerProps) {
  const [newTag, setNewTag] = useState("");
  const [showSets, setShowSets] = useState(false);
  const seasonalContext = getSeasonalContext();

  const addTag = (tag: string) => {
    const normalised = tag.startsWith("#") ? tag : `#${tag}`;
    if (!hashtags.includes(normalised)) {
      onChange([...hashtags, normalised]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(hashtags.filter((h) => h !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      addTag(newTag.trim());
      setNewTag("");
    }
  };

  const applySet = (setKey: HashtagSet) => {
    const resolvedTags =
      setKey === "F" ? seasonalContext.tags : ROTATION_SETS[setKey].tags;
    const tags = [...BRANDED_TAGS, ...resolvedTags].slice(0, 12);
    onChange(tags);
    setShowSets(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">
          Hashtags ({hashtags.length})
        </label>
        <div className="flex items-center gap-2">
          {currentSet && (
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                background: "var(--accent-purple)",
                color: "#fff",
              }}
            >
              Set {currentSet}:{" "}
              {currentSet === "F"
                ? seasonalContext.label
                : ROTATION_SETS[currentSet].pillar}
            </span>
          )}
          <button
            onClick={() => setShowSets(!showSets)}
            className="text-xs underline cursor-pointer"
            style={{ color: "var(--accent-blue)" }}
          >
            {showSets ? "Hide sets" : "Use a set"}
          </button>
        </div>
      </div>

      {/* Quick set selection */}
      {showSets && (
        <div
          className="grid grid-cols-2 gap-2 p-3 rounded-lg"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {(Object.keys(ROTATION_SETS) as HashtagSet[]).map((key) => (
            <button
              key={key}
              onClick={() => applySet(key)}
              className="text-left p-2 rounded text-xs transition-colors hover:opacity-80 cursor-pointer"
              style={{
                background:
                  currentSet === key
                    ? "var(--accent-blue)"
                    : "var(--bg-secondary)",
                color: currentSet === key ? "#fff" : "var(--text-primary)",
              }}
            >
              <span className="font-medium">Set {key}</span>
              <br />
              <span
                style={{
                  color: currentSet === key ? "#ddd" : "var(--text-secondary)",
                }}
              >
                {key === "F"
                  ? `${seasonalContext.label}${seasonalContext.isCampaign ? " ✦" : ""}`
                  : ROTATION_SETS[key].pillar}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Current hashtags */}
      <div className="flex flex-wrap gap-1.5">
        {hashtags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{
              background: BRANDED_TAGS.includes(
                tag as (typeof BRANDED_TAGS)[number],
              )
                ? "var(--accent-blue)"
                : "var(--bg-card)",
              color: BRANDED_TAGS.includes(tag as (typeof BRANDED_TAGS)[number])
                ? "#fff"
                : "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:opacity-70 cursor-pointer"
            >
              x
            </button>
          </span>
        ))}
      </div>

      {/* Add custom tag */}
      <input
        type="text"
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add hashtag (press Enter)"
        className="w-full px-3 py-2 rounded-lg text-sm"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}
