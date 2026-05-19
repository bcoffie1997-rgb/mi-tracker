"use client";

import { ViewMode } from "@/lib/storage";
import { Columns, Rows, Layers } from "@/components/Icons";

interface ViewSwitcherProps {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}

const VIEWS: { key: ViewMode; label: string; Icon: typeof Columns }[] = [
  { key: "kanban",  label: "Kanban",  Icon: Columns },
  { key: "table",   label: "Table",   Icon: Rows    },
  { key: "grouped", label: "Grouped", Icon: Layers  },
];

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="View"
      className="inline-flex items-center bg-paper-card border border-ink/10 rounded p-0.5"
    >
      {VIEWS.map(({ key, label, Icon }) => {
        const active = key === value;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-sm transition-colors ${
              active
                ? "bg-ink text-paper font-medium"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
