"use client";

import { Tier, Category, Owner, TIERS, CATEGORIES, OWNERS, TIER_COLORS } from "@/lib/types";
import { Search, X } from "./Icons";

export interface FilterState {
  search: string;
  tier: Tier | "all";
  category: Category | "all";
  owner: Owner | "all";
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  resultCount: number;
  totalCount: number;
}

export function FilterBar({ filters, onChange, resultCount, totalCount }: FilterBarProps) {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...filters, [k]: v });
  const hasActive = filters.search || filters.tier !== "all" || filters.category !== "all" || filters.owner !== "all";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative flex items-center">
        <Search size={13} className="absolute left-2.5 text-ink-muted pointer-events-none" />
        <input
          placeholder="Search organization, contact, or notes…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="text-[12px] bg-paper-card border border-ink/10 rounded pl-7 pr-2 py-1.5 w-[280px] outline-none focus:border-ink/20 placeholder:text-ink-faint"
        />
        {filters.search && (
          <button
            onClick={() => set("search", "")}
            className="absolute right-1.5 text-ink-muted hover:text-ink p-0.5"
          >
            <X size={11} />
          </button>
        )}
      </div>

      <FilterSelect
        value={filters.tier}
        onChange={(v) => set("tier", v as FilterState["tier"])}
        options={[{ label: "All tiers", value: "all" }, ...TIERS.map((t) => ({ label: t, value: t, color: TIER_COLORS[t] }))]}
      />

      <FilterSelect
        value={filters.category}
        onChange={(v) => set("category", v as FilterState["category"])}
        options={[{ label: "All categories", value: "all" }, ...CATEGORIES.map((c) => ({ label: c, value: c }))]}
      />

      <FilterSelect
        value={filters.owner}
        onChange={(v) => set("owner", v as FilterState["owner"])}
        options={[{ label: "All owners", value: "all" }, ...OWNERS.map((o) => ({ label: o, value: o }))]}
      />

      {hasActive && (
        <button
          onClick={() => onChange({ search: "", tier: "all", category: "all", owner: "all" })}
          className="text-[11px] text-ink-muted hover:text-ink underline underline-offset-2"
        >
          clear
        </button>
      )}

      <div className="ml-auto text-[11px] font-mono text-ink-muted tabular-nums">
        {hasActive ? `${resultCount} of ${totalCount}` : `${totalCount} contacts`}
      </div>
    </div>
  );
}

interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; color?: string }[];
}

function FilterSelect({ value, onChange, options }: FilterSelectProps) {
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`text-[12px] bg-paper-card border border-ink/10 rounded px-2.5 py-1.5 outline-none focus:border-ink/20 hover:border-ink/15 cursor-pointer appearance-none pr-7 ${
          selected?.color ? "pl-6" : ""
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {selected?.color && (
        <span
          className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
          style={{ background: selected.color }}
        />
      )}
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted text-[8px] pointer-events-none">▾</span>
    </div>
  );
}
