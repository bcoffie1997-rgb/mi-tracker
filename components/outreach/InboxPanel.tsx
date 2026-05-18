"use client";

import { useMemo } from "react";
import { Contact, SentMessage } from "@/lib/types";
import { Inbox, Reply } from "@/components/Icons";

interface InboxPanelProps {
  messages: SentMessage[];
  contacts: Contact[];
}

export function InboxPanel({ messages, contacts }: InboxPanelProps) {
  const contactById = useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts]
  );

  const replied = useMemo(
    () =>
      messages
        .filter((m) => m.replied)
        .sort((a, b) =>
          (b.lastReplyAt ?? b.sentAt).localeCompare(a.lastReplyAt ?? a.sentAt)
        ),
    [messages]
  );

  if (replied.length === 0) {
    return (
      <div className="text-center py-16 text-ink-muted">
        <Inbox size={24} className="mx-auto opacity-40" />
        <p className="mt-3 text-[13px]">No replies logged yet.</p>
        <p className="text-[11px] mt-1">
          On the Sent tab, click a message and tap "Log a reply" when a prospect
          responds. Gmail-side reply sync arrives in a later step.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {replied.map((m) => {
        const c = contactById.get(m.contactId);
        return (
          <div
            key={m.id}
            className="bg-paper-card border border-ink/10 rounded-lg card-shadow px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <Reply size={13} className="text-sage" />
              <span className="text-[13px] font-medium text-ink truncate">
                {c?.contactName || "(unknown)"}
              </span>
              <span className="text-[12px] text-ink-muted truncate">
                · {c?.organization}
              </span>
              <span className="ml-auto text-[11px] font-mono text-ink-muted">
                {formatDate(m.lastReplyAt ?? m.sentAt)}
              </span>
            </div>
            <div className="mt-1.5 text-[12px] text-ink-muted">
              Replied to: <span className="text-ink">{m.subject}</span>
            </div>
            {m.lastReplySnippet && (
              <div className="mt-2 text-[12px] text-ink bg-paper-soft border border-ink/10 rounded px-3 py-2 font-mono leading-relaxed">
                {m.lastReplySnippet}
              </div>
            )}
          </div>
        );
      })}
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
