"use client";

import { useMemo, useState } from "react";
import { Contact, EmailTemplate, SentMessage } from "@/lib/types";
import { Reply, Trash, Mail, Check } from "@/components/Icons";

interface SentPanelProps {
  messages: SentMessage[];
  contacts: Contact[];
  templates: EmailTemplate[];
  onToggleReplied: (messageId: string) => void;
  onDelete: (messageId: string) => void;
}

export function SentPanel({
  messages,
  contacts,
  templates,
  onToggleReplied,
  onDelete,
}: SentPanelProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const contactById = useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts]
  );
  const tmplById = useMemo(
    () => new Map(templates.map((t) => [t.id, t])),
    [templates]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = messages.slice().sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    if (!q) return sorted;
    return sorted.filter((m) => {
      const c = contactById.get(m.contactId);
      const blob = `${m.subject} ${m.bodyPreview} ${c?.contactName ?? ""} ${c?.organization ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [messages, search, contactById]);

  if (messages.length === 0) {
    return (
      <div className="text-center py-16 text-ink-muted">
        <Mail size={24} className="mx-auto opacity-40" />
        <p className="mt-3 text-[13px]">No messages logged yet.</p>
        <p className="text-[11px] mt-1">
          Compose a new outreach and click "Log as sent" to track it here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <input
          type="search"
          placeholder="Search subject, body, contact, organization…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md text-[12px] bg-paper-card border border-ink/10 rounded px-3 py-1.5 focus:outline-none focus:border-accent"
        />
      </div>

      <div className="bg-paper-card border border-ink/10 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 px-4 py-2 border-b border-ink/10 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          <div>Contact</div>
          <div>Subject</div>
          <div>Step</div>
          <div>Sent</div>
          <div></div>
        </div>
        {filtered.map((m) => {
          const c = contactById.get(m.contactId);
          const tmpl = m.templateId ? tmplById.get(m.templateId) : undefined;
          const isOpen = expanded === m.id;
          return (
            <div
              key={m.id}
              className="border-b border-ink/5 last:border-b-0 hover:bg-paper-soft/50 transition-colors"
            >
              <div
                className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-3 px-4 py-2.5 items-center cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : m.id)}
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-ink truncate">
                    {c?.contactName || "(unknown)"}
                  </div>
                  <div className="text-[11px] text-ink-muted truncate">
                    {c?.organization}
                  </div>
                </div>
                <div className="text-[12px] text-ink truncate">{m.subject}</div>
                <div className="text-[11px] font-mono text-ink-muted">
                  {m.step + 1}
                  {tmpl && <span className="ml-1 text-ink-faint">· {tmpl.name}</span>}
                </div>
                <div className="text-[11px] font-mono text-ink-muted whitespace-nowrap">
                  {formatDate(m.sentAt)}
                </div>
                <div className="flex items-center gap-1">
                  {m.replied ? (
                    <span
                      className="pill"
                      style={{ background: "rgba(61, 122, 75, 0.1)", borderColor: "rgba(61, 122, 75, 0.3)", color: "#3D7A4B" }}
                    >
                      <Check size={11} /> Replied
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-muted font-mono">—</span>
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 -mt-1 space-y-3 bg-paper-soft/40">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                      Body
                    </div>
                    <pre className="text-[12px] font-mono whitespace-pre-wrap text-ink bg-paper-card border border-ink/10 rounded p-3 leading-relaxed">
                      {m.body}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleReplied(m.id)}
                      className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded border border-ink/15 hover:bg-ink/5 text-ink font-medium"
                    >
                      <Reply size={12} />
                      {m.replied ? "Mark unreplied" : "Log a reply"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this message from your history?")) {
                          onDelete(m.id);
                        }
                      }}
                      className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded text-rust hover:bg-rust/5 font-medium"
                    >
                      <Trash size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-[12px] text-ink-muted">
            No messages match your search.
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}
