"use client";

import { Contact, ACTIVE_PIPELINE_STATUSES, DEAL_MIDPOINTS } from "@/lib/types";

interface DashboardProps {
  contacts: Contact[];
}

export function Dashboard({ contacts }: DashboardProps) {
  const total = contacts.length;

  const activePipelineCount = contacts.filter((c) =>
    ACTIVE_PIPELINE_STATUSES.includes(c.status)
  ).length;

  const activePipelineValue = contacts
    .filter((c) => ACTIVE_PIPELINE_STATUSES.includes(c.status))
    .reduce((sum, c) => sum + (DEAL_MIDPOINTS[c.dealSize] ?? 0), 0);

  const closedWonValue = contacts
    .filter((c) => c.status === "Closed Won")
    .reduce((sum, c) => sum + (DEAL_MIDPOINTS[c.dealSize] ?? 0), 0);

  const overdue = contacts.filter(
    (c) =>
      c.nextActionDate &&
      new Date(c.nextActionDate) < new Date() &&
      c.status !== "Closed Won" &&
      c.status !== "Closed Lost"
  ).length;

  // Y1 ARR target from memo
  const targetARR = 500000;
  const targetProgress = targetARR > 0 ? Math.min(closedWonValue / targetARR, 1) : 0;

  const metrics = [
    { label: "Prospects", value: total.toString(), sub: "total" },
    { label: "Active Pipeline", value: activePipelineCount.toString(), sub: `$${(activePipelineValue / 1000).toFixed(0)}K` },
    { label: "Closed Won ARR", value: `$${(closedWonValue / 1000).toFixed(0)}K`, sub: "year-to-date" },
    {
      label: "Y1 Target Progress",
      value: `${Math.round(targetProgress * 100)}%`,
      sub: `of $${(targetARR / 1000).toFixed(0)}K`,
      progress: targetProgress,
    },
    {
      label: "Overdue",
      value: overdue.toString(),
      sub: "next actions",
      urgent: overdue > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-ink/10 border border-ink/10 rounded-lg overflow-hidden">
      {metrics.map((m, i) => (
        <div
          key={m.label}
          className="bg-paper-card px-5 py-3 ticker"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="metric-label">{m.label}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`serif-display text-2xl font-medium tabular-nums tracking-tighter ${
                m.urgent ? "text-rust" : "text-ink"
              }`}
            >
              {m.value}
            </span>
            <span className="text-[10px] text-ink-muted font-mono uppercase tracking-wider">
              {m.sub}
            </span>
          </div>
          {m.progress !== undefined && (
            <div className="mt-2 h-[2px] bg-ink/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-sage transition-all duration-500 rounded-full"
                style={{ width: `${m.progress * 100}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
