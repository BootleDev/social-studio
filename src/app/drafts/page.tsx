"use client";

export default function DraftsPage() {
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
          <a href="/compose" style={{ color: "var(--text-secondary)" }}>
            Compose
          </a>
          <a
            href="/drafts"
            className="font-medium"
            style={{ color: "var(--accent-blue)" }}
          >
            Drafts
          </a>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Drafts & Scheduled</h2>
        <div
          className="p-8 rounded-lg text-center"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ color: "var(--text-secondary)" }}>
            No drafts or scheduled posts yet.
          </p>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            Scheduling will be available once the ScheduleQueue table is
            configured in Airtable.
          </p>
        </div>
      </div>
    </div>
  );
}
