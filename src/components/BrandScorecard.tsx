"use client";

interface BrandScorecardProps {
  result: Record<string, unknown>;
}

export function BrandScorecard({ result }: BrandScorecardProps) {
  const score = (result.score as number) ?? 0;
  const aiTells = (result.aiTells as string[]) ?? [];
  const pillar = (result.pillar as string) ?? "";
  const altHook = (result.altHook as string) ?? "";

  const scoreColor =
    score >= 8
      ? "var(--accent-green)"
      : score >= 5
        ? "var(--accent-amber)"
        : "var(--accent-red)";

  return (
    <div
      className="p-4 rounded-lg space-y-3"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Brand Score</h3>
        <span
          className="text-2xl font-bold"
          style={{ color: scoreColor }}
        >
          {score}/10
        </span>
      </div>

      {/* Content pillar */}
      {pillar && (
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
          >
            Pillar: {pillar}
          </span>
        </div>
      )}

      {/* AI tells */}
      {aiTells.length > 0 && (
        <div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--accent-amber)" }}
          >
            AI Tells Detected:
          </p>
          <ul className="space-y-1">
            {aiTells.map((tell, i) => (
              <li
                key={i}
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {tell}
              </li>
            ))}
          </ul>
        </div>
      )}

      {aiTells.length === 0 && score >= 8 && (
        <p className="text-xs" style={{ color: "var(--accent-green)" }}>
          No AI tells detected. Copy reads naturally.
        </p>
      )}

      {/* Alternative hook */}
      {altHook && (
        <div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Alternative hook:
          </p>
          <p
            className="text-sm italic"
            style={{ color: "var(--text-primary)" }}
          >
            {altHook}
          </p>
        </div>
      )}
    </div>
  );
}
