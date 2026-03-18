"use client";

import { useState, useEffect } from "react";

interface AIPanelProps {
  result: Record<string, unknown> | null;
  loading: boolean;
}

interface IntelligenceData {
  trendReport: Record<string, unknown> | null;
  recentPosts: Record<string, unknown>[];
  creativeBriefs: Record<string, unknown>[];
  topCompetitorContent: Record<string, unknown>[];
}

export function AIPanel({ result, loading }: AIPanelProps) {
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(
    null,
  );
  const [loadingIntel, setLoadingIntel] = useState(true);

  useEffect(() => {
    fetch("/api/intelligence")
      .then((res) => res.json())
      .then((data) => setIntelligence(data))
      .catch((err) => console.error("[Intelligence]", err))
      .finally(() => setLoadingIntel(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2
        className="text-sm font-bold uppercase tracking-wider"
        style={{ color: "var(--text-secondary)" }}
      >
        Intelligence
      </h2>

      {/* AI status */}
      {loading && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            background: "var(--bg-card)",
            color: "var(--accent-purple)",
          }}
        >
          Generating captions...
        </div>
      )}

      {/* Latest trend report */}
      <Section title="This Week's Trends" loading={loadingIntel}>
        {intelligence?.trendReport ? (
          <div
            className="space-y-2 text-xs"
            style={{ color: "var(--text-secondary)" }}
          >
            {intelligence.trendReport["Full Report"] ? (
              <p className="line-clamp-6">
                {String(intelligence.trendReport["Full Report"]).slice(0, 500)}
                ...
              </p>
            ) : (
              <p>No trend data yet.</p>
            )}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            No trend report available.
          </p>
        )}
      </Section>

      {/* Top performing recent posts */}
      <Section title="Your Top Posts" loading={loadingIntel}>
        {intelligence?.recentPosts && intelligence.recentPosts.length > 0 ? (
          <div className="space-y-2">
            {intelligence.recentPosts.slice(0, 3).map((post, i) => (
              <div
                key={i}
                className="p-2 rounded text-xs"
                style={{ background: "var(--bg-secondary)" }}
              >
                <p
                  className="line-clamp-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {String(post["Caption"] || "No caption").slice(0, 100)}
                </p>
                <div
                  className="flex gap-3 mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span>ER: {String(post["Engagement Rate"] ?? "N/A")}</span>
                  <span>Reach: {String(post["Reach"] ?? "N/A")}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            No posts yet.
          </p>
        )}
      </Section>

      {/* Creative brief suggestions */}
      <Section title="Brief Ideas" loading={loadingIntel}>
        {intelligence?.creativeBriefs &&
        intelligence.creativeBriefs.length > 0 ? (
          <div className="space-y-2">
            {intelligence.creativeBriefs.map((brief, i) => (
              <div
                key={i}
                className="p-2 rounded text-xs"
                style={{ background: "var(--bg-secondary)" }}
              >
                <p
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {String(brief["Brief Title"] || "Untitled")}
                </p>
                <p
                  className="mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {String(brief["Hook"] || "")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            No briefs available.
          </p>
        )}
      </Section>

      {/* Top competitor hooks */}
      <Section title="Competitor Hooks" loading={loadingIntel}>
        {intelligence?.topCompetitorContent &&
        intelligence.topCompetitorContent.length > 0 ? (
          <div className="space-y-2">
            {intelligence.topCompetitorContent.slice(0, 5).map((content, i) => (
              <div
                key={i}
                className="p-2 rounded text-xs"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div className="flex justify-between">
                  <span className="font-medium">
                    @{String(content["Handle"] || "")}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {Number(content["Views"] || 0).toLocaleString()} views
                  </span>
                </div>
                {typeof content["Spoken Hook"] === "string" &&
                  content["Spoken Hook"] && (
                    <p
                      className="mt-0.5 italic"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {String(content["Spoken Hook"])}
                    </p>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            No competitor data.
          </p>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-3 rounded-lg"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <h3
        className="text-xs font-medium mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      {loading ? (
        <div
          className="h-12 rounded animate-pulse"
          style={{ background: "var(--bg-secondary)" }}
        />
      ) : (
        children
      )}
    </div>
  );
}
