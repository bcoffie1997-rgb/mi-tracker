"use client";

import { useMemo, useState } from "react";
import {
  CHANGELOG,
  ChangelogEntry,
  groupByDay,
  stripTrailers,
} from "@/lib/changelog";
import { Search, FileText } from "@/components/Icons";

// Conventional-commit-ish prefix tags. We don't enforce them — if a commit
// doesn't start with one, the entry just has no tag.
const TAG_PATTERNS: { match: RegExp; label: string; tone: string }[] = [
  { match: /^add\b/i,                          label: "Add",      tone: "bg-sage/15 text-sage border-sage/30" },
  { match: /^feat(ure)?[:\s]/i,                label: "Feature",  tone: "bg-sage/15 text-sage border-sage/30" },
  { match: /^fix\b/i,                          label: "Fix",      tone: "bg-rust/10 text-rust border-rust/30" },
  { match: /^update\b/i,                       label: "Update",   tone: "bg-gold/10 text-gold border-gold/30" },
  { match: /^(remove|delete|drop)\b/i,         label: "Remove",   tone: "bg-ink/8 text-ink-muted border-ink/15" },
  { match: /^(refactor|chore|cleanup)\b/i,     label: "Chore",    tone: "bg-ink/8 text-ink-muted border-ink/15" },
  { match: /^docs?\b/i,                        label: "Docs",     tone: "bg-accent/10 text-accent border-accent/30" },
];

function detectTag(subject: string): { label: string; tone: string } | null {
  for (const t of TAG_PATTERNS) {
    if (t.match.test(subject)) return { label: t.label, tone: t.tone };
  }
  return null;
}

function prettyTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Changelog() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CHANGELOG;
    return CHANGELOG.filter((e) => {
      const blob = `${e.subject} ${e.body} ${e.author} ${e.hash}`.toLowerCase();
      return blob.includes(q);
    });
  }, [search]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  if (CHANGELOG.length === 0) {
    return (
      <div className="text-center py-16 text-ink-muted">
        <FileText size={24} className="mx-auto opacity-40" />
        <p className="mt-3 text-[13px]">No changelog entries yet.</p>
        <p className="text-[11px] mt-1">
          The changelog is generated from <span className="font-mono">git log</span> at
          build time. Run <span className="font-mono">npm run changelog</span> to
          regenerate.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-5 relative max-w-md">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
          <Search size={13} />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subject, body, hash, author…"
          className="w-full text-[12px] bg-paper-card border border-ink/10 rounded pl-8 pr-3 py-1.5 focus:outline-none focus:border-accent"
        />
      </div>

      {groups.length === 0 ? (
        <div className="text-[12px] text-ink-muted py-8 text-center">
          No entries match your search.
        </div>
      ) : (
        <ol className="relative">
          {/* Vertical timeline rail */}
          <div className="absolute left-3 top-1 bottom-1 w-px bg-ink/10" />

          {groups.map((group) => (
            <li key={group.dayKey} className="mb-8 last:mb-0">
              {/* Day heading */}
              <div className="flex items-center gap-3 mb-3 relative">
                <span className="relative z-10 w-6 h-6 rounded-full bg-paper border-2 border-ink flex items-center justify-center text-[10px] font-mono">
                  {group.entries.length}
                </span>
                <h3 className="serif-display text-xl font-medium tracking-tighter text-ink">
                  {group.label}
                </h3>
              </div>

              {/* Entries on this day */}
              <ul className="ml-9 space-y-3">
                {group.entries.map((entry) => (
                  <ChangelogCard key={entry.hash} entry={entry} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
  const tag = detectTag(entry.subject);
  const body = stripTrailers(entry.body);

  return (
    <li className="bg-paper-card border border-ink/10 rounded-lg card-shadow px-4 py-3">
      <div className="flex items-start gap-2 flex-wrap">
        {tag && (
          <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${tag.tone}`}>
            {tag.label}
          </span>
        )}
        <h4 className="text-[13px] font-medium text-ink leading-snug flex-1 min-w-0">
          {entry.subject}
        </h4>
        <span className="text-[11px] font-mono text-ink-muted whitespace-nowrap">
          {prettyTime(entry.date)}
        </span>
      </div>
      {body && (
        <pre className="mt-2 text-[12px] font-sans whitespace-pre-wrap text-ink-soft leading-relaxed">
          {body}
        </pre>
      )}
      <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-muted">
        <span className="font-mono">{entry.hash}</span>
        <span>·</span>
        <span>{entry.author}</span>
      </div>
    </li>
  );
}
