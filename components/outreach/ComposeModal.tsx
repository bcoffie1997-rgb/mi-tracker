"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Contact,
  EmailTemplate,
  Sequence,
  SentMessage,
} from "@/lib/types";
import { renderTemplate, gmailComposeUrl } from "@/lib/email/templates";
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
    const url = gmailComposeUrl({ to: contact.email, subject, body });
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

  function handleLogSent() {
    if (!contact) {
      alert("Pick a contact before logging this as sent.");
      return;
    }
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
    };
    // Update the contact's touch tracking
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
    onLogSent(msg, contactUpdates);
  }

  const canLog = !!contact && subject.trim().length > 0 && body.trim().length > 0;

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
                className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded font-medium transition-colors ${
                  canLog
                    ? "bg-ink text-paper hover:bg-ink/90"
                    : "bg-ink/20 text-paper cursor-not-allowed"
                }`}
                title={didOpenGmail ? "" : "Click after sending in Gmail to log this message"}
              >
                <Send size={12} />
                {didOpenGmail ? "Mark as sent" : "Log as sent"}
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
