"use client";

import { useMemo, useState } from "react";
import {
  Contact,
  Category,
  Tier,
  STATUS_COLORS,
  TIER_COLORS,
  CATEGORIES,
  TIERS,
} from "@/lib/types";
import { ChevronRight } from "@/components/Icons";

type GroupBy = "category" | "tier" | "owner";

interface GroupedViewProps {
  contacts: Contact[];
  onCardClick: (id: string) => void;
}

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "tier",     label: "Tier"     },
  { key: "owner",    label: "Owner"    },
];

function groupOrder(by: GroupBy): readonly string[] {
  if (by === "category") return CATEGORIES;
  if (by === "tier") return TIERS;
  return ["Branden", "Eric", "Joint", "TBD"];
}

export function GroupedView({ contacts, onCardClick }: GroupedViewProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("category");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, Contact[]>();
    for (const c of contacts) {
      const key = c[groupBy as keyof Contact] as string;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    // Sort by canonical group order; unknown groups go last.
    const order = groupOrder(groupBy);
    return [...map.entries()].sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [contacts, groupBy]);

  function toggle(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-16 text-[13px] text-ink-muted">
        No contacts match the current filters.
      </div>
    );
  }

  return (
    <div>
      {/* Group-by control */}
      <div className="flex items-center gap-2 mb-3 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
        Group by
        <div className="inline-flex items-center bg-paper-card border border-ink/10 rounded p-0.5">
          {GROUP_OPTIONS.map((opt) => {
            const active = opt.key === groupBy;
            return (
              <button
                key={opt.key}
                onClick={() => setGroupBy(opt.key)}
                className={`text-[11px] px-2 py-0.5 rounded-sm normal-case tracking-normal transition-colors ${
                  active
                    ? "bg-ink text-paper font-medium"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {groups.map(([key, list]) => {
          const isCollapsed = collapsed.has(key);
          return (
            <section
              key={key}
              className="bg-paper-card border border-ink/10 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-paper-soft/60 border-b border-ink/10"
              >
                <ChevronRight
                  size={13}
                  className={`text-ink-muted transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                />
                <h3 className="serif-display text-[15px] font-medium tracking-tighter text-ink">
                  {key || "—"}
                </h3>
                <span className="text-[11px] font-mono text-ink-muted tabular-nums ml-1">
                  {list.length}
                </span>
                <span className="ml-auto text-[11px] font-mono text-ink-muted tabular-nums">
                  {list.filter((c) => c.status !== "Not Started" && c.status !== "Closed Lost").length} active
                </span>
              </button>

              {!isCollapsed && (
                <ul className="divide-y divide-ink/5">
                  {list.map((c) => (
                    <li
                      key={c.id}
                      onClick={() => onCardClick(c.id)}
                      className="grid grid-cols-[110px_1fr_1fr_140px_100px] gap-3 px-4 py-2.5 cursor-pointer hover:bg-paper-soft/60 items-center"
                    >
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: TIER_COLORS[c.tier] }}
                        />
                        {c.tier}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-ink truncate">
                          {c.organization}
                        </div>
                        {c.subOrg && (
                          <div className="text-[11px] text-ink-muted truncate">
                            {c.subOrg}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] text-ink truncate">
                          {c.contactName || <span className="text-ink-faint">—</span>}
                        </div>
                        <div className="text-[11px] text-ink-muted truncate">
                          {c.email || c.title || ""}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[11px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: STATUS_COLORS[c.status] }}
                        />
                        {c.status}
                      </span>
                      <span className="text-[11px] font-mono text-ink-muted text-right">
                        {c.dealSize}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
