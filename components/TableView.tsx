"use client";

import { useMemo, useState } from "react";
import { Contact, STATUS_COLORS, TIER_COLORS } from "@/lib/types";
import { ChevronDown } from "@/components/Icons";

interface TableViewProps {
  contacts: Contact[];
  onCardClick: (id: string) => void;
}

type SortKey =
  | "organization"
  | "contactName"
  | "tier"
  | "category"
  | "status"
  | "dealSize"
  | "owner"
  | "lastTouch"
  | "nextActionDate";

type SortDir = "asc" | "desc";

interface Column {
  key: SortKey | "email" | "phone";
  label: string;
  sortable: boolean;
  className?: string;
  render: (c: Contact) => React.ReactNode;
}

const COLUMNS: Column[] = [
  {
    key: "tier",
    label: "Tier",
    sortable: true,
    className: "w-[90px]",
    render: (c) => (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: TIER_COLORS[c.tier] }}
        />
        {c.tier}
      </span>
    ),
  },
  {
    key: "organization",
    label: "Organization",
    sortable: true,
    render: (c) => (
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">
          {c.organization}
        </div>
        {c.subOrg && (
          <div className="text-[11px] text-ink-muted truncate">{c.subOrg}</div>
        )}
      </div>
    ),
  },
  {
    key: "contactName",
    label: "Contact",
    sortable: true,
    render: (c) => (
      <div className="min-w-0">
        <div className="text-[12px] text-ink truncate">
          {c.contactName || <span className="text-ink-faint">—</span>}
        </div>
        {c.title && (
          <div className="text-[11px] text-ink-muted truncate">{c.title}</div>
        )}
      </div>
    ),
  },
  {
    key: "email",
    label: "Email",
    sortable: false,
    render: (c) =>
      c.email ? (
        <a
          href={`mailto:${c.email}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-mono text-accent hover:underline truncate block"
        >
          {c.email}
        </a>
      ) : (
        <span className="text-[11px] text-ink-faint">—</span>
      ),
  },
  {
    key: "phone",
    label: "Phone",
    sortable: false,
    className: "w-[130px]",
    render: (c) =>
      c.phone ? (
        <span className="text-[11px] font-mono text-ink-muted">{c.phone}</span>
      ) : (
        <span className="text-[11px] text-ink-faint">—</span>
      ),
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    className: "w-[140px]",
    render: (c) => (
      <span className="inline-flex items-center gap-1.5 text-[11px]">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: STATUS_COLORS[c.status] }}
        />
        {c.status}
      </span>
    ),
  },
  {
    key: "dealSize",
    label: "Deal",
    sortable: true,
    className: "w-[100px]",
    render: (c) => (
      <span className="text-[11px] font-mono text-ink-muted">{c.dealSize}</span>
    ),
  },
  {
    key: "owner",
    label: "Owner",
    sortable: true,
    className: "w-[80px]",
    render: (c) => (
      <span className="text-[11px] text-ink-muted">{c.owner}</span>
    ),
  },
  {
    key: "nextActionDate",
    label: "Next",
    sortable: true,
    className: "w-[110px]",
    render: (c) => {
      if (!c.nextActionDate) {
        return <span className="text-[11px] text-ink-faint">—</span>;
      }
      const due = new Date(c.nextActionDate);
      const overdue =
        !Number.isNaN(due.getTime()) &&
        due < new Date() &&
        c.status !== "Closed Won" &&
        c.status !== "Closed Lost";
      return (
        <span
          className={`text-[11px] font-mono ${overdue ? "text-rust font-medium" : "text-ink-muted"}`}
        >
          {c.nextActionDate.slice(0, 10)}
        </span>
      );
    },
  },
];

const TIER_ORDER = ["Tier 1", "Tier 2", "Tier 3", "Channel"];

function compareValues(a: Contact, b: Contact, key: SortKey): number {
  if (key === "tier") {
    return TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
  }
  const av = (a as any)[key] ?? "";
  const bv = (b as any)[key] ?? "";
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv));
}

export function TableView({ contacts, onCardClick }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("tier");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    const out = contacts.slice();
    out.sort((a, b) => {
      const cmp = compareValues(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [contacts, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-16 text-[13px] text-ink-muted">
        No contacts match the current filters.
      </div>
    );
  }

  return (
    <div className="bg-paper-card border border-ink/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-paper-soft border-b border-ink/10">
              {COLUMNS.map((col) => {
                const active = col.sortable && col.key === sortKey;
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key as SortKey) : undefined}
                    className={`px-3 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-ink-muted font-medium ${
                      col.sortable ? "cursor-pointer hover:bg-ink/5" : ""
                    } ${col.className ?? ""}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {active && (
                        <ChevronDown
                          size={10}
                          className={`transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr
                key={c.id}
                onClick={() => onCardClick(c.id)}
                className="border-b border-ink/5 last:border-b-0 hover:bg-paper-soft/60 cursor-pointer transition-colors"
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 align-top ${col.className ?? ""}`}
                  >
                    {col.render(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
