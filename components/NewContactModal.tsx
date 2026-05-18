"use client";

import { useState } from "react";
import { Contact, TIERS, CATEGORIES, OWNERS, DEAL_SIZES, Tier, Category, Owner } from "@/lib/types";
import { newId } from "@/lib/storage";
import { X } from "./Icons";

interface NewContactModalProps {
  onClose: () => void;
  onCreate: (c: Contact) => void;
}

export function NewContactModal({ onClose, onCreate }: NewContactModalProps) {
  const now = new Date().toISOString();
  const [draft, setDraft] = useState<Partial<Contact>>({
    tier: "Tier 2",
    category: "APEX Accelerator",
    owner: "Branden",
    dealSize: "TBD",
    status: "Not Started",
    organization: "",
    contactName: "",
    email: "",
  });

  function update<K extends keyof Contact>(k: K, v: Contact[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function create() {
    if (!draft.organization?.trim()) return;
    const contact: Contact = {
      id: newId(),
      tier: (draft.tier as Tier) || "Tier 2",
      category: (draft.category as Category) || "APEX Accelerator",
      organization: draft.organization || "",
      subOrg: draft.subOrg || "",
      contactName: draft.contactName || "",
      title: draft.title || "",
      email: draft.email || "",
      phone: draft.phone || "",
      linkedin: draft.linkedin || "",
      orgUrl: draft.orgUrl || "",
      location: draft.location || "",
      dealSize: draft.dealSize || "TBD",
      status: "Not Started",
      firstTouch: "",
      lastTouch: "",
      touches: 0,
      nextAction: draft.nextAction || "",
      nextActionDate: "",
      outreachHook: draft.outreachHook || "",
      owner: (draft.owner as Owner) || "Branden",
      notes: draft.notes || "",
      source: draft.source || "manual",
      createdAt: now,
      updatedAt: now,
    };
    onCreate(contact);
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-40 overlay-fade" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-paper border border-ink/10 rounded-lg w-full max-w-md shadow-cardHover pointer-events-auto overlay-fade">
          <header className="px-5 py-4 border-b border-ink/10 flex items-center">
            <h2 className="serif-display text-lg font-medium tracking-tighter">New contact</h2>
            <button onClick={onClose} className="ml-auto text-ink-muted hover:text-ink">
              <X size={16} />
            </button>
          </header>

          <div className="p-5 space-y-4">
            <Row label="Organization *">
              <input
                autoFocus
                placeholder="e.g. Texas APEX Accelerator"
                className="w-full text-sm bg-paper-soft/50 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft"
                value={draft.organization}
                onChange={(e) => update("organization", e.target.value)}
              />
            </Row>

            <Row label="Contact Name">
              <input
                placeholder="Full name"
                className="w-full text-sm bg-paper-soft/50 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft"
                value={draft.contactName}
                onChange={(e) => update("contactName", e.target.value)}
              />
            </Row>

            <Row label="Title">
              <input
                placeholder="e.g. Executive Director"
                className="w-full text-sm bg-paper-soft/50 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft"
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </Row>

            <Row label="Email">
              <input
                type="email"
                className="w-full text-sm bg-paper-soft/50 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft font-mono"
                value={draft.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </Row>

            <div className="grid grid-cols-2 gap-3">
              <Row label="Tier">
                <select
                  className="w-full text-sm bg-paper-soft/50 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft"
                  value={draft.tier}
                  onChange={(e) => update("tier", e.target.value as Tier)}
                >
                  {TIERS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Row>
              <Row label="Category">
                <select
                  className="w-full text-sm bg-paper-soft/50 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft"
                  value={draft.category}
                  onChange={(e) => update("category", e.target.value as Category)}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Row>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Row label="Deal Size">
                <select
                  className="w-full text-sm bg-paper-soft/50 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft"
                  value={draft.dealSize}
                  onChange={(e) => update("dealSize", e.target.value)}
                >
                  {DEAL_SIZES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Row>
              <Row label="Owner">
                <select
                  className="w-full text-sm bg-paper-soft/50 border border-ink/10 rounded px-2 py-1.5 outline-none focus:bg-paper-soft"
                  value={draft.owner}
                  onChange={(e) => update("owner", e.target.value as Owner)}
                >
                  {OWNERS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Row>
            </div>
          </div>

          <footer className="px-5 py-3 border-t border-ink/10 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="text-[12px] px-3 py-1.5 rounded text-ink-muted hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              onClick={create}
              disabled={!draft.organization?.trim()}
              className="text-[12px] px-3 py-1.5 rounded bg-ink text-paper hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Create contact
            </button>
          </footer>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="metric-label block mb-1">{label}</label>
      {children}
    </div>
  );
}
