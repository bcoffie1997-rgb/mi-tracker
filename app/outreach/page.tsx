"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Contact,
  EmailTemplate,
  Sequence,
  SentMessage,
} from "@/lib/types";
import {
  loadContacts,
  saveContacts,
  loadTemplates,
  saveTemplates,
  loadSequences,
  saveSequences,
  loadMessages,
  saveMessages,
  loadSenderName,
  saveSenderName,
  loadSenderEmail,
  saveSenderEmail,
} from "@/lib/storage";
import { computeQueue, dueCount } from "@/lib/email/sequence";
import { TopBar } from "@/components/TopBar";
import { Send, Inbox, Mail, FileText, Zap, Plus } from "@/components/Icons";
import { QueuePanel } from "@/components/outreach/QueuePanel";
import { SentPanel } from "@/components/outreach/SentPanel";
import { InboxPanel } from "@/components/outreach/InboxPanel";
import { TemplateEditor } from "@/components/outreach/TemplateEditor";
import { SequenceEditor } from "@/components/outreach/SequenceEditor";
import { ComposeModal, ComposeRequest } from "@/components/outreach/ComposeModal";
import { GmailConnection } from "@/components/outreach/GmailConnection";
import type { AuthStatus } from "@/lib/email/api-client";

type Tab = "queue" | "sent" | "inbox" | "templates" | "sequences";

const TABS: { key: Tab; label: string; icon: typeof Send }[] = [
  { key: "queue",     label: "Queue",     icon: Zap      },
  { key: "inbox",     label: "Inbox",     icon: Inbox    },
  { key: "sent",      label: "Sent",      icon: Send     },
  { key: "templates", label: "Templates", icon: FileText },
  { key: "sequences", label: "Sequences", icon: Mail     },
];

export default function OutreachPage() {
  const [hydrated, setHydrated]   = useState(false);
  const [contacts, setContacts]   = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [messages, setMessages]   = useState<SentMessage[]>([]);
  const [senderName, setSenderName] = useState<string>("");
  const [senderEmail, setSenderEmail] = useState<string>("");
  const [tab, setTab] = useState<Tab>("queue");
  const [compose, setCompose] = useState<ComposeRequest | null>(null);
  const [gmailStatus, setGmailStatus] = useState<AuthStatus>({ connected: false, email: null });

  // Hydrate from localStorage on mount
  useEffect(() => {
    setContacts(loadContacts());
    setTemplates(loadTemplates());
    setSequences(loadSequences());
    setMessages(loadMessages());
    setSenderName(loadSenderName());
    setSenderEmail(loadSenderEmail());
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => { if (hydrated) saveContacts(contacts); },   [contacts, hydrated]);
  useEffect(() => { if (hydrated) saveTemplates(templates); }, [templates, hydrated]);
  useEffect(() => { if (hydrated) saveSequences(sequences); }, [sequences, hydrated]);
  useEffect(() => { if (hydrated) saveMessages(messages); },   [messages, hydrated]);
  useEffect(() => { if (hydrated) saveSenderName(senderName); }, [senderName, hydrated]);
  useEffect(() => { if (hydrated) saveSenderEmail(senderEmail); }, [senderEmail, hydrated]);

  const queue = useMemo(
    () => computeQueue({ contacts, messages, sequences }),
    [contacts, messages, sequences]
  );

  const queueDue = dueCount(queue);
  const inboxCount = messages.filter((m) => m.replied).length;

  function reloadAll() {
    setContacts(loadContacts());
    setTemplates(loadTemplates());
    setSequences(loadSequences());
    setMessages(loadMessages());
    setSenderName(loadSenderName());
    setSenderEmail(loadSenderEmail());
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink-muted text-sm font-mono">loading…</div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen pb-12">
      <TopBar
        activePage="outreach"
        onDataReplaced={reloadAll}
        actions={
          <button
            onClick={() => setCompose({ contactId: null, step: 0 })}
            className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded bg-ink text-paper hover:bg-ink/90 transition-colors font-medium"
          >
            <Plus size={13} />
            New outreach
          </button>
        }
      />

      <div className="max-w-[1400px] mx-auto px-6 py-5">
        {/* Page intro */}
        <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="serif-display text-2xl font-semibold tracking-tighter text-ink leading-tight">
              Outreach
            </h2>
            <p className="text-[13px] text-ink-muted mt-1 max-w-2xl">
              Manage your sequenced follow-ups. The Queue surfaces who's due next;
              every send is logged so you can see what you've already shipped.
            </p>
          </div>

          {/* Sender identity — name powers the {{senderName}} merge field;
              email pins the Open-in-Gmail URL to the right Workspace account.
              The GmailConnection chip shows OAuth state and acts as the
              Connect / Disconnect control. */}
          <div className="flex items-center gap-3 flex-wrap">
            <GmailConnection
              onChange={(s) => {
                setGmailStatus(s);
                if (s.email && !senderEmail) setSenderEmail(s.email);
              }}
            />
            <label className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              Signed as
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Branden"
                className="text-[12px] font-sans normal-case tracking-normal text-ink bg-paper-card border border-ink/10 rounded px-2 py-1 w-32 focus:outline-none focus:border-accent"
              />
            </label>
            <label className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-ink-muted">
              Send from
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="branden@trymindyai.com"
                className="text-[12px] font-sans normal-case tracking-normal text-ink bg-paper-card border border-ink/10 rounded px-2 py-1 w-56 focus:outline-none focus:border-accent"
              />
            </label>
          </div>
        </div>

        {/* Outreach metrics strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-ink/10 border border-ink/10 rounded-lg overflow-hidden mb-5">
          <MetricCell label="Due now"      value={queueDue.toString()}                  sub="overdue + today" urgent={queueDue > 0} />
          <MetricCell label="In queue"     value={queue.length.toString()}              sub="total upcoming" />
          <MetricCell label="Sent"         value={messages.length.toString()}           sub="all-time" />
          <MetricCell label="Replies"      value={inboxCount.toString()}                sub="logged" />
          <MetricCell label="Templates"    value={templates.length.toString()}          sub={`${sequences.length} sequence${sequences.length === 1 ? "" : "s"}`} />
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-ink/10 mb-5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.key === tab;
            const badge =
              t.key === "queue"
                ? queueDue
                : t.key === "inbox"
                ? inboxCount
                : 0;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                <Icon size={13} />
                {t.label}
                {badge > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      active ? "bg-ink text-paper" : "bg-ink/10 text-ink"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "queue" && (
          <QueuePanel
            items={queue}
            templates={templates}
            onCompose={(req) => setCompose(req)}
          />
        )}
        {tab === "sent" && (
          <SentPanel
            messages={messages}
            contacts={contacts}
            templates={templates}
            onToggleReplied={(messageId) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        replied: !m.replied,
                        lastReplyAt: !m.replied ? new Date().toISOString() : undefined,
                      }
                    : m
                )
              );
            }}
            onDelete={(messageId) => {
              setMessages((prev) => prev.filter((m) => m.id !== messageId));
            }}
          />
        )}
        {tab === "inbox" && (
          <InboxPanel
            messages={messages}
            contacts={contacts}
          />
        )}
        {tab === "templates" && (
          <TemplateEditor
            templates={templates}
            onChange={setTemplates}
            senderName={senderName}
            sampleContact={contacts[0]}
          />
        )}
        {tab === "sequences" && (
          <SequenceEditor
            sequences={sequences}
            templates={templates}
            onChange={setSequences}
          />
        )}
      </div>

      {compose && (
        <ComposeModal
          request={compose}
          contacts={contacts}
          templates={templates}
          sequences={sequences}
          messages={messages}
          senderName={senderName}
          senderEmail={senderEmail}
          gmailConnected={gmailStatus.connected}
          onClose={() => setCompose(null)}
          onLogSent={(msg, contactUpdates) => {
            setMessages((prev) => [msg, ...prev]);
            if (contactUpdates) {
              setContacts((prev) =>
                prev.map((c) => (c.id === contactUpdates.id ? contactUpdates : c))
              );
            }
            setCompose(null);
          }}
        />
      )}
    </main>
  );
}

function MetricCell({
  label,
  value,
  sub,
  urgent,
}: {
  label: string;
  value: string;
  sub: string;
  urgent?: boolean;
}) {
  return (
    <div className="bg-paper-card px-5 py-3 ticker">
      <div className="metric-label">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <span
          className={`serif-display text-2xl font-medium tabular-nums tracking-tighter ${
            urgent ? "text-rust" : "text-ink"
          }`}
        >
          {value}
        </span>
        <span className="text-[10px] text-ink-muted font-mono uppercase tracking-wider">
          {sub}
        </span>
      </div>
    </div>
  );
}
