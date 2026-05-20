"use client";

import { useState } from "react";
import { QueueItem, QueueBucket } from "@/lib/email/sequence";
import { EmailTemplate } from "@/lib/types";
import { renderTemplate } from "@/lib/email/templates";
import { Send, Mail, ChevronDown } from "@/components/Icons";
import { ComposeRequest } from "./ComposeModal";

interface QueuePanelProps {
  items: QueueItem[];
  templates: EmailTemplate[];
  senderName: string;
  onCompose: (req: ComposeRequest) => void;
}

const SECTIONS: { key: QueueBucket; label: string; tone: "rust" | "gold" | "muted" }[] = [
  { key: "overdue",    label: "Overdue",   tone: "rust"  },
  { key: "due_today",  label: "Due today", tone: "gold"  },
  { key: "upcoming",   label: "Upcoming",  tone: "muted" },
];

export function QueuePanel({ items, templates, senderName, onCompose }: QueuePanelProps) {
  const tmplById = new Map(templates.map((t) => [t.id, t]));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
                const isOpen = expanded.has(item.contact.id);
                return (
                  <QueueCard
                    key={item.contact.id}
                    item={item}
                    tmpl={tmpl}
                    senderName={senderName}
                    isOpen={isOpen}
                    onToggle={() => toggle(item.contact.id)}
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
  senderName,
  isOpen,
  onToggle,
  onDraft,
}: {
  item: QueueItem;
  tmpl: EmailTemplate | undefined;
  senderName: string;
  isOpen: boolean;
  onToggle: () => void;
  onDraft: () => void;
}) {
  const c = item.contact;
  const dueLabel =
    item.daysUntilDue < 0
      ? `${Math.abs(item.daysUntilDue)}d overdue`
      : item.daysUntilDue === 0
      ? "Due today"
      : `In ${item.daysUntilDue}d`;

  // Render the actual merged email only when expanded (perf: with 200+ rows
  // we don't want to do this work on every render).
  const merged = isOpen && tmpl
    ? renderTemplate(tmpl, { contact: c, senderName })
    : null;

  return (
    <div className="bg-paper-card border border-ink/10 rounded-lg card-shadow overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          disabled={!tmpl}
          className="flex items-center justify-center w-6 h-6 rounded text-ink-muted hover:text-ink hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={isOpen ? "Hide preview" : "Preview email"}
          aria-expanded={isOpen}
          title={tmpl ? (isOpen ? "Hide preview" : "Preview the merged email") : "No template for this step"}
        >
          <ChevronDown
            size={13}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

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
            {!c.email && (
              <>
                <span className="font-mono">·</span>
                <span className="text-rust">no email on file</span>
              </>
            )}
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

      {/* Expanded preview — the actual subject + body that would be sent.
          Read-only here; click Draft to make edits. */}
      {isOpen && merged && (
        <div className="border-t border-ink/10 bg-paper-soft/50 px-4 py-3 space-y-2">
          <div className="flex items-baseline gap-3 text-[11px] text-ink-muted">
            <span className="font-mono uppercase tracking-wider w-12">To</span>
            <span className="font-mono text-ink">
              {c.email || <span className="text-rust">no email on file</span>}
            </span>
          </div>
          <div className="flex items-baseline gap-3 text-[11px] text-ink-muted">
            <span className="font-mono uppercase tracking-wider w-12">Subj</span>
            <span className="text-[13px] text-ink font-medium">{merged.subject}</span>
          </div>
          <div className="flex items-baseline gap-3 text-[11px] text-ink-muted">
            <span className="font-mono uppercase tracking-wider w-12 pt-0.5">Body</span>
            <pre className="text-[12px] font-mono whitespace-pre-wrap text-ink leading-relaxed flex-1 bg-paper-card border border-ink/10 rounded p-2.5">
              {merged.body}
            </pre>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink-faint mt-1">
            This is exactly what will send. Click Draft to edit.
          </p>
        </div>
      )}
    </div>
  );
}
