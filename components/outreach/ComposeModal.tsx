"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Contact,
  EmailTemplate,
  Sequence,
  SentMessage,
} from "@/lib/types";
import { renderTemplate, gmailComposeUrl } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/api-client";
import { newId } from "@/lib/storage";
import { X, Send, ArrowUpRight, Copy, Check } from "@/components/Icons";

export interface ComposeRequest {
  contactId: string | null;
  step: number;
  templateId?: string;
  sequenceId?: string;
}

interface ComposeModalProps {
  request: ComposeRequest;
  contacts: Contact[];
  templates: EmailTemplate[];
  sequences: Sequence[];
  messages: SentMessage[];
  senderName: string;
  senderEmail?: string;
  gmailConnected?: boolean;
  onClose: () => void;
  onLogSent: (msg: SentMessage, contactUpdates: Contact | null) => void;
}

export function ComposeModal({
  request,
  contacts,
  templates,
  sequences,
  messages,
  senderName,
  senderEmail,
  gmailConnected,
  onClose,
  onLogSent,
}: ComposeModalProps) {
  const [contactId, setContactId]   = useState<string>(request.contactId ?? "");
  const [templateId, setTemplateId] = useState<string>(request.templateId ?? "");
  const [step, setStep]             = useState<number>(request.step ?? 0);
  const [subject, setSubject]       = useState<string>("");
  const [body, setBody]             = useState<string>("");
  const [didOpenGmail, setDidOpenGmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const contact = contacts.find((c) => c.id === contactId) ?? null;

  // When request changes, re-init
  useEffect(() => {
    setContactId(request.contactId ?? "");
    setTemplateId(request.templateId ?? "");
    setStep(request.step ?? 0);
    setDidOpenGmail(false);
  }, [request]);

  // Pick a sensible default template once we have a contact
  useEffect(() => {
    if (!templateId && templates.length > 0) {
      const match = templates.find((t) => t.step === step) ?? templates[0];
      setTemplateId(match.id);
    }
  }, [templateId, templates, step]);

  // Re-render subject/body whenever the template, contact, or sender changes
  useEffect(() => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl || !contact) {
      // Allow editing even without a contact (you can pick one or write freely)
      if (tmpl && !contact) {
        setSubject(tmpl.subject);
        setBody(tmpl.body);
      }
      return;
    }
    const rendered = renderTemplate(tmpl, { contact, senderName });
    setSubject(rendered.subject);
    setBody(rendered.body);
  }, [templateId, contact, senderName, templates]);

  const priorForContact = useMemo(() => {
    if (!contactId) return [] as SentMessage[];
    return messages
      .filter((m) => m.contactId === contactId)
      .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }, [messages, contactId]);

  function handleOpenGmail() {
    if (!contact?.email) {
      alert("This contact has no email address on file.");
      return;
    }
    const url = gmailComposeUrl({
      to: contact.email,
      subject,
      body,
      senderEmail,
    });
    window.open(url, "_blank", "noopener,noreferrer");
    setDidOpenGmail(true);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Copy failed — your browser blocked clipboard access.");
    }
  }

  function buildSentMessage(gmailIds?: {
    messageId: string;
    threadId: string;
    rfc822MessageId: string;
  }): { msg: SentMessage; contactUpdates: Contact } | null {
    if (!contact) return null;
    const now = new Date().toISOString();
    const msg: SentMessage = {
      id: newId("msg"),
      contactId: contact.id,
      sequenceId: request.sequenceId,
      templateId: templateId || undefined,
      step,
      subject,
      body,
      bodyPreview: body.slice(0, 200),
      sentAt: now,
      replied: false,
      gmailMessageId: gmailIds?.messageId,
      gmailThreadId: gmailIds?.threadId,
      rfc822MessageId: gmailIds?.rfc822MessageId,
    };
    const contactUpdates: Contact = {
      ...contact,
      lastTouch: now,
      firstTouch: contact.firstTouch || now,
      touches: contact.touches + 1,
      status:
        contact.status === "Not Started" || contact.status === "Researching"
          ? "Outreach Sent"
          : contact.status,
      updatedAt: now,
    };
    return { msg, contactUpdates };
  }

  function handleLogSent() {
    const built = buildSentMessage();
    if (!built) {
      alert("Pick a contact before logging this as sent.");
      return;
    }
    onLogSent(built.msg, built.contactUpdates);
  }

  // The "Send via Gmail" path — POSTs to /api/email/send, which uses the
  // server-side OAuth client + the user's refresh token to deliver via
  // the Gmail API. On success we record the SentMessage with the real
  // Gmail messageId + threadId for future reply matching.
  async function handleSendViaGmail() {
    if (!contact?.email) {
      alert("This contact has no email address on file.");
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      const result = await sendEmail({
        to: contact.email,
        subject,
        body,
        fromName: senderName || undefined,
      });
      if (!result.ok) {
        if (result.status === 401) {
          alert("Gmail is not connected. Click 'Connect Gmail' on the outreach page first.");
        } else {
          alert(`Send failed: ${result.message}`);
        }
        return;
      }
      const built = buildSentMessage({
        messageId: result.messageId,
        threadId: result.threadId,
        rfc822MessageId: result.rfc822MessageId,
      });
      if (built) onLogSent(built.msg, built.contactUpdates);
    } catch (err: any) {
      alert(`Send failed: ${err?.message ?? "Unknown error"}`);
    } finally {
      setSending(false);
    }
  }

  const canLog = !!contact && subject.trim().length > 0 && body.trim().length > 0;
  const canSend = canLog && !!gmailConnected && !!contact?.email && !sending;

  return (
    <>
      <div
        className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-40 overlay-fade"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-paper border border-ink/10 rounded-lg w-full max-w-2xl shadow-cardHover pointer-events-auto overlay-fade flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink/10">
            <div>
              <h2 className="serif-display text-lg font-medium tracking-tighter">
                Compose
              </h2>
              <p className="text-[11px] text-ink-muted font-mono uppercase tracking-wider mt-0.5">
                Step {step + 1} · {step === 0 ? "Initial" : `Follow-up ${step}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-ink/5 text-ink-muted hover:text-ink"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Contact + template pickers */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact">
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="w-full text-[12px] bg-paper-card border border-ink/10 rounded px-2 py-1.5 focus:outline-none focus:border-accent"
                >
                  <option value="">— Pick a contact —</option>
                  {contacts
                    .slice()
                    .sort((a, b) => a.organization.localeCompare(b.organization))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contactName ? `${c.contactName} · ` : ""}
                        {c.organization}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Template">
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full text-[12px] bg-paper-card border border-ink/10 rounded px-2 py-1.5 focus:outline-none focus:border-accent"
                >
                  <option value="">— None (write freely) —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Contact summary */}
            {contact && (
              <div className="bg-paper-soft border border-ink/10 rounded px-3 py-2 text-[11px] text-ink-muted flex items-center gap-3 flex-wrap">
                <span className="font-mono">{contact.email || "(no email)"}</span>
                <span>·</span>
                <span>{contact.title}</span>
                <span>·</span>
                <span>{contact.tier} · {contact.category}</span>
                {priorForContact.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{priorForContact.length} prior touch{priorForContact.length === 1 ? "" : "es"}</span>
                  </>
                )}
              </div>
            )}

            {/* Research context — the notes we collected for this contact
                during research. Surface them here so the user has the
                intel while writing a personal opener, but it stays out of
                the auto-merged body. */}
            {contact && (contact.outreachHook?.trim() || contact.notes?.trim()) && (
              <details className="bg-accent/5 border border-accent/20 rounded text-[12px] open:pb-2">
                <summary className="cursor-pointer px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-accent select-none">
                  Research context — click to expand
                </summary>
                <div className="px-3 space-y-2">
                  {contact.outreachHook?.trim() && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5">
                        Outreach hook
                      </div>
                      <p className="text-[12px] text-ink leading-relaxed">
                        {contact.outreachHook}
                      </p>
                    </div>
                  )}
                  {contact.notes?.trim() && (
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5">
                        Notes
                      </div>
                      <pre className="text-[12px] font-sans whitespace-pre-wrap text-ink-soft leading-relaxed">
                        {contact.notes}
                      </pre>
                    </div>
                  )}
                  <p className="text-[10px] text-ink-muted italic pt-1">
                    These don&apos;t auto-merge into the email — they&apos;re for you
                    to reference while personalizing the body above.
                  </p>
                </div>
              </details>
            )}

            {/* Subject + body */}
            <Field label="Subject">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-[13px] bg-paper-card border border-ink/10 rounded px-2 py-1.5 focus:outline-none focus:border-accent"
              />
            </Field>
            <Field label="Body">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="w-full text-[13px] font-mono bg-paper-card border border-ink/10 rounded px-2 py-2 focus:outline-none focus:border-accent leading-relaxed"
              />
            </Field>
            {!contact && (
              <p className="text-[11px] text-ink-muted">
                Merge fields like <code className="font-mono">{`{{firstName}}`}</code> stay
                as-is until you pick a contact above.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ink/10 px-5 py-3 flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenGmail}
              disabled={!contact?.email}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded border border-ink/15 hover:bg-ink/5 text-ink font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              title={!contact?.email ? "Pick a contact with an email first" : "Open a pre-filled Gmail compose window"}
            >
              <ArrowUpRight size={12} />
              Open in Gmail
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded border border-ink/15 hover:bg-ink/5 text-ink font-medium"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-[12px] px-3 py-1.5 rounded text-ink-muted hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                onClick={handleLogSent}
                disabled={!canLog}
                className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded font-medium border border-ink/15 hover:bg-ink/5 text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                title={didOpenGmail ? "" : "Already sent in Gmail? Log it manually"}
              >
                {didOpenGmail ? "Mark as sent" : "Log as sent"}
              </button>
              <button
                onClick={handleSendViaGmail}
                disabled={!canSend}
                className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded font-medium transition-colors ${
                  canSend
                    ? "bg-ink text-paper hover:bg-ink/90"
                    : "bg-ink/20 text-paper cursor-not-allowed"
                }`}
                title={
                  !gmailConnected
                    ? "Connect Gmail from the outreach page first"
                    : !contact?.email
                    ? "Pick a contact with an email"
                    : "Send via Gmail API"
                }
              >
                <Send size={12} />
                {sending ? "Sending…" : "Send via Gmail"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
