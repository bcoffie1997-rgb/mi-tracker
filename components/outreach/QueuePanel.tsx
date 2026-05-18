"use client";

import { QueueItem, QueueBucket } from "@/lib/email/sequence";
import { EmailTemplate } from "@/lib/types";
import { Send, Mail } from "@/components/Icons";
import { ComposeRequest } from "./ComposeModal";

interface QueuePanelProps {
  items: QueueItem[];
  templates: EmailTemplate[];
  onCompose: (req: ComposeRequest) => void;
}

const SECTIONS: { key: QueueBucket; label: string; tone: "rust" | "gold" | "muted" }[] = [
  { key: "overdue",    label: "Overdue",   tone: "rust"  },
  { key: "due_today",  label: "Due today", tone: "gold"  },
  { key: "upcoming",   label: "Upcoming",  tone: "muted" },
];

export function QueuePanel({ items, templates, onCompose }: QueuePanelProps) {
  const tmplById = new Map(templates.map((t) => [t.id, t]));

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-ink-muted">
        <Mail size={24} className="mx-auto opacity-40" />
        <p className="mt-3 text-[13px]">No contacts are queued for outreach.</p>
        <p className="text-[11px] mt-1">
          Move a contact to <span className="font-mono">Outreach Sent</span> or add
          a new one on the Board to start a sequence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => {
        const bucket = items.filter((i) => i.bucket === section.key);
        if (bucket.length === 0) return null;
        return (
          <div key={section.key}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-[11px] font-mono uppercase tracking-wider font-medium ${
                section.tone === "rust"   ? "text-rust" :
                section.tone === "gold"   ? "text-gold" :
                                            "text-ink-muted"
              }`}>
                {section.label}
              </h3>
              <span className="text-[11px] text-ink-muted font-mono tabular-nums">
                {bucket.length}
              </span>
            </div>
            <div className="space-y-2">
              {bucket.map((item) => {
                const step = item.sequence.steps[item.nextStepIndex];
                const tmpl = step ? tmplById.get(step.templateId) : undefined;
                return (
                  <QueueCard
                    key={item.contact.id}
                    item={item}
                    tmpl={tmpl}
                    onDraft={() =>
                      onCompose({
                        contactId: item.contact.id,
                        step: item.nextStepIndex,
                        templateId: tmpl?.id,
                        sequenceId: item.sequence.id,
                      })
                    }
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QueueCard({
  item,
  tmpl,
  onDraft,
}: {
  item: QueueItem;
  tmpl: EmailTemplate | undefined;
  onDraft: () => void;
}) {
  const c = item.contact;
  const dueLabel =
    item.daysUntilDue < 0
      ? `${Math.abs(item.daysUntilDue)}d overdue`
      : item.daysUntilDue === 0
      ? "Due today"
      : `In ${item.daysUntilDue}d`;

  return (
    <div className="bg-paper-card border border-ink/10 rounded-lg card-shadow px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-ink truncate">
            {c.contactName || "(no name)"}
          </span>
          <span className="text-[12px] text-ink-muted truncate">
            · {c.organization}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-muted">
          <span className="font-mono">
            Step {item.nextStepIndex + 1}/{item.sequence.steps.length}
          </span>
          <span className="font-mono">·</span>
          <span>{tmpl?.name ?? "(no template)"}</span>
          <span className="font-mono">·</span>
          <span className={item.daysUntilDue < 0 ? "text-rust font-medium" : ""}>
            {dueLabel}
          </span>
        </div>
      </div>
      <button
        onClick={onDraft}
        disabled={!tmpl}
        className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded bg-ink text-paper hover:bg-ink/90 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send size={12} />
        Draft
      </button>
    </div>
  );
}
