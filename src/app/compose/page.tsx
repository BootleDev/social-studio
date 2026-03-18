"use client";

import { useState, useCallback } from "react";
import { Composer } from "@/components/Composer";
import { AIPanel } from "@/components/AIPanel";
import { Instructions } from "@/components/Instructions";

export default function ComposePage() {
  const [aiResult, setAIResult] = useState<Record<string, unknown> | null>(
    null,
  );
  const [aiLoading, setAILoading] = useState(false);

  const handleAIGenerate = useCallback(
    async (params: {
      draftCaption?: string;
      postType: string;
      platforms: { instagram: boolean; facebook: boolean };
      mediaDescription?: string;
      lastUsedSet?: string;
    }) => {
      setAILoading(true);
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || "AI generation failed");
        }
        const data = await res.json();
        setAIResult(data);
        return data;
      } catch (error) {
        console.error("[AI]", error);
        throw error;
      } finally {
        setAILoading(false);
      }
    },
    [],
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Bootle</h1>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              background: "var(--accent-blue)",
              color: "#fff",
            }}
          >
            Studio
          </span>
        </div>
        <nav className="flex gap-4 text-sm">
          <a
            href="/compose"
            className="font-medium"
            style={{ color: "var(--accent-blue)" }}
          >
            Compose
          </a>
          <a href="/drafts" style={{ color: "var(--text-secondary)" }}>
            Drafts
          </a>
        </nav>
      </header>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <Instructions />
      </div>

      {/* Main layout: Composer + AI Panel */}
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        <div className="flex-1 p-6">
          <Composer
            onAIGenerate={handleAIGenerate}
            aiResult={aiResult}
            aiLoading={aiLoading}
          />
        </div>
        <div
          className="w-full lg:w-96 p-6 lg:border-l"
          style={{ borderColor: "var(--border)" }}
        >
          <AIPanel result={aiResult} loading={aiLoading} />
        </div>
      </div>
    </div>
  );
}
