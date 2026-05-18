"use client";

import { useState, useEffect } from "react";
import { Contact, Status, Tier, Category, Owner, STATUSES, TIERS, CATEGORIES, OWNERS, DEAL_SIZES, STATUS_COLORS, TIER_COLORS } from "@/lib/types";
import { X, Mail, Phone, Link as LinkIcon, ExternalLink, Trash, Edit, Sparkles } from "./Icons";

interface ContactDetailProps {
  contact: Contact;
  onClose: () => void;
  onSave: (updated: Contact) => void;
  onDelete: (id: string) => void;
}

export function ContactDetail({ contact, onClose, onSave, onDelete }: ContactDetailProps) {
  const [draft, setDraft] = useState<Contact>(contact);
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setDraft(contact);
    setDirty(false);
    setConfirmDelete(false);
  }, [contact.id]);

  function update<K extends keyof Contact>(field: K, value: Contact[K]) {
    setDraft((d) => ({ ...d, [field]: value, updatedAt: new Date().toISOString() }));
    setDirty(true);
  }

  function save() {
    onSave(draft);
    setDirty(false);
  }

  // Auto-save on close if dirty
  function close() {
    if (dirty) save();
    onClose();
  }

  // ESC closes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, draft]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] z-40 overlay-fade"
        onClick={close}
      />
      {/* Panel */}
      <aside className="fixed top-0 right-0 bottom-0 w-full max-w-[600px] bg-paper z-50 shadow-panel slide-in flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-ink/10 flex items-center gap-3 flex-shrink-0">
          <span
            className="text-[10px] font-mono uppercase tracking-wider font-medium px-2 py-0.5 rounded-sm"
            style={{
              background: `${TIER_COLORS[draft.tier]}18`,
              color: TIER_COLORS[draft.tier],
            }}
          >
            {draft.tier}
          </span>
          <span className="text-[10px] font-mono text-ink-muted tracking-wider uppercase">
            {draft.id}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {dirty && (
              <button
                onClick={save}
                className="text-[11px] px-3 py-1 rounded-sm bg-ink text-paper hover:bg-ink/90 transition-colors font-medium"
              >
                Save changes
              </button>
            )}
            <button
              onClick={close}
              className="text-ink-muted hover:text-ink transition-colors p-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Org & contact name (display as headlines) */}
          <Field label="Organization">
            <input
              className="serif-display text-2xl text-ink font-medium tracking-tighter w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 -mx-1"
              value={draft.organization}
              onChange={(e) => update("organization", e.target.value)}
            />
          </Field>

          <Field label="Sub-Org / Chapter">
            <input
              className="text-sm text-ink-soft w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 -mx-1"
              value={draft.subOrg}
              onChange={(e) => update("subOrg", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-x-6 mt-4">
            <Field label="Contact Name">
              <input
                className="text-sm text-ink w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 -mx-1 font-medium"
                value={draft.contactName}
                onChange={(e) => update("contactName", e.target.value)}
              />
            </Field>
            <Field label="Title">
              <input
                className="text-sm text-ink-soft w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 -mx-1"
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </Field>
          </div>

          {/* Status & meta — selects */}
          <Section title="Pipeline">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <FieldSelect
                label="Status"
                value={draft.status}
                options={STATUSES}
                onChange={(v) => update("status", v as Status)}
                colored={(opt) => STATUS_COLORS[opt as Status]}
              />
              <FieldSelect
                label="Tier"
                value={draft.tier}
                options={TIERS}
                onChange={(v) => update("tier", v as Tier)}
                colored={(opt) => TIER_COLORS[opt as Tier]}
              />
              <FieldSelect
                label="Category"
                value={draft.category}
                options={CATEGORIES}
                onChange={(v) => update("category", v as Category)}
              />
              <FieldSelect
                label="Owner"
                value={draft.owner}
                options={OWNERS}
                onChange={(v) => update("owner", v as Owner)}
              />
              <FieldSelect
                label="Deal Size"
                value={draft.dealSize}
                options={DEAL_SIZES}
                onChange={(v) => update("dealSize", v)}
              />
              <FieldDate
                label="Next Action Date"
                value={draft.nextActionDate}
                onChange={(v) => update("nextActionDate", v)}
              />
            </div>
            <Field label="Next Action" wide>
              <input
                className="text-sm text-ink w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 -mx-1 py-1"
                value={draft.nextAction}
                onChange={(e) => update("nextAction", e.target.value)}
                placeholder="e.g. send re-engagement email"
              />
            </Field>
          </Section>

          {/* Contact details */}
          <Section title="Contact">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Email" wide>
                <div className="flex items-center gap-2 group">
                  <Mail size={12} className="text-ink-muted flex-shrink-0" />
                  <input
                    className="text-sm text-ink w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 font-mono"
                    value={draft.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="(not yet researched)"
                  />
                  {draft.email && (
                    <a
                      href={`mailto:${draft.email}`}
                      className="text-ink-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </Field>
              <Field label="Phone" wide>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-ink-muted flex-shrink-0" />
                  <input
                    className="text-sm text-ink w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 font-mono"
                    value={draft.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(not yet researched)"
                  />
                </div>
              </Field>
              <Field label="LinkedIn" wide>
                <div className="flex items-center gap-2 group">
                  <LinkIcon size={12} className="text-ink-muted flex-shrink-0" />
                  <input
                    className="text-sm text-ink w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 font-mono text-[12px]"
                    value={draft.linkedin}
                    onChange={(e) => update("linkedin", e.target.value)}
                    placeholder=""
                  />
                  {draft.linkedin && (
                    <a
                      href={draft.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </Field>
              <Field label="Org URL" wide>
                <div className="flex items-center gap-2 group">
                  <LinkIcon size={12} className="text-ink-muted flex-shrink-0" />
                  <input
                    className="text-sm text-ink w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 font-mono text-[12px]"
                    value={draft.orgUrl}
                    onChange={(e) => update("orgUrl", e.target.value)}
                  />
                  {draft.orgUrl && (
                    <a
                      href={draft.orgUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink-muted hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </Field>
              <Field label="Location">
                <input
                  className="text-sm text-ink w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 -mx-1"
                  value={draft.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </Field>
              <Field label="Source">
                <input
                  className="text-sm text-ink-muted w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 -mx-1 text-[12px]"
                  value={draft.source}
                  onChange={(e) => update("source", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* Outreach hook */}
          <Section title={<span className="flex items-center gap-1.5"><Sparkles size={12} /> Outreach Hook</span>}>
            <textarea
              className="w-full text-sm text-ink bg-paper-soft/50 rounded p-3 border-0 outline-none focus:bg-paper-soft resize-none leading-relaxed"
              rows={6}
              value={draft.outreachHook}
              onChange={(e) => update("outreachHook", e.target.value)}
              placeholder="What's the personalized angle for first-touch?"
            />
          </Section>

          {/* Notes */}
          <Section title="Internal Notes">
            <textarea
              className="w-full text-sm text-ink bg-paper-soft/50 rounded p-3 border-0 outline-none focus:bg-paper-soft resize-none leading-relaxed"
              rows={4}
              value={draft.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Internal context, conversation history, etc."
            />
          </Section>

          {/* Touch tracking */}
          <Section title="Touchpoints">
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <FieldDate label="First Touch" value={draft.firstTouch} onChange={(v) => update("firstTouch", v)} />
              <FieldDate label="Last Touch" value={draft.lastTouch} onChange={(v) => update("lastTouch", v)} />
              <Field label="# Touches">
                <input
                  type="number"
                  className="text-sm text-ink w-full bg-transparent border-0 outline-none focus:bg-paper-soft rounded px-1 -mx-1 font-mono"
                  value={draft.touches}
                  onChange={(e) => update("touches", parseInt(e.target.value) || 0)}
                  min={0}
                />
              </Field>
            </div>
          </Section>

          {/* Danger zone */}
          <div className="mt-12 pt-6 border-t border-ink/10">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[12px] text-ink-faint hover:text-rust transition-colors flex items-center gap-1.5"
              >
                <Trash size={12} />
                Delete contact
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-rust">Delete this contact permanently?</span>
                <button
                  onClick={() => onDelete(draft.id)}
                  className="text-[11px] px-2.5 py-1 rounded bg-rust text-paper hover:bg-rust/90 transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] px-2.5 py-1 rounded bg-ink/5 text-ink-muted hover:bg-ink/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`${wide ? "col-span-2" : ""} mt-3 first:mt-0`}>
      <label className="metric-label block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="serif-display text-[13px] font-medium text-ink uppercase tracking-wider mb-3 pb-1.5 border-b border-ink/10">
        {title}
      </h3>
      {children}
    </section>
  );
}

interface FieldSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  colored?: (opt: string) => string;
}

function FieldSelect({ label, value, options, onChange, colored }: FieldSelectProps) {
  return (
    <Field label={label}>
      <div className="relative">
        {colored && (
          <span
            className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{ background: colored(value) }}
          />
        )}
        <select
          className={`text-sm text-ink w-full bg-paper-soft/40 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft hover:bg-paper-soft/70 transition-colors cursor-pointer appearance-none ${
            colored ? "pl-6" : ""
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
    </Field>
  );
}

function FieldDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Normalize date for input (yyyy-mm-dd)
  const dateValue = value ? value.slice(0, 10) : "";
  return (
    <Field label={label}>
      <input
        type="date"
        className="text-sm text-ink w-full bg-paper-soft/40 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft hover:bg-paper-soft/70 transition-colors font-mono"
        value={dateValue}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
      />
    </Field>
  );
}
