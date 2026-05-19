// Source: scripts/generate-changelog.mjs writes lib/changelog.generated.json
// from `git log` at prebuild/predev time. This file is the typed surface.

import raw from "./changelog.generated.json";

export interface ChangelogEntry {
  hash: string;
  author: string;
  date: string;       // ISO 8601 with timezone
  subject: string;
  body: string;
}

export interface ChangelogDayGroup {
  dayKey: string;         // YYYY-MM-DD
  label: string;          // pretty heading e.g. "May 18, 2026"
  entries: ChangelogEntry[];
}

export const CHANGELOG: ChangelogEntry[] = raw as ChangelogEntry[];

function dayKey(iso: string): string {
  // ISO dates start with YYYY-MM-DD — slice avoids timezone-shift bugs from
  // running through Date() on the server.
  return iso.slice(0, 10);
}

function prettyDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function groupByDay(entries: ChangelogEntry[]): ChangelogDayGroup[] {
  const map = new Map<string, ChangelogEntry[]>();
  for (const e of entries) {
    const k = dayKey(e.date);
    const arr = map.get(k) ?? [];
    arr.push(e);
    map.set(k, arr);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([k, list]) => ({
      dayKey: k,
      label: prettyDate(list[0]?.date ?? k),
      entries: list.slice().sort((a, b) => b.date.localeCompare(a.date)),
    }));
}

// Drop trailing trailer lines (e.g. Co-Authored-By:) from commit bodies — they
// are git plumbing noise, not user-facing content. Preserves blank lines /
// paragraph structure of the rest of the body.
const TRAILER = /^[A-Z][A-Za-z-]+:\s.+/;
export function stripTrailers(body: string): string {
  if (!body) return "";
  const lines = body.split("\n");
  let end = lines.length;
  while (end > 0) {
    const line = lines[end - 1].trim();
    if (line === "" || TRAILER.test(line)) {
      end -= 1;
    } else {
      break;
    }
  }
  return lines.slice(0, end).join("\n").trim();
}
