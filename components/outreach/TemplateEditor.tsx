"use client";

import { useEffect, useState } from "react";
import { Contact, EmailTemplate, MERGE_FIELDS } from "@/lib/types";
import { newId } from "@/lib/storage";
import { renderTemplate } from "@/lib/email/templates";
import { Plus, Trash, FileText } from "@/components/Icons";

interface TemplateEditorProps {
  templates: EmailTemplate[];
  onChange: (next: EmailTemplate[]) => void;
  senderName: string;
  sampleContact: Contact | undefined;
}

export function TemplateEditor({
  templates,
  onChange,
  senderName,
  sampleContact,
}: TemplateEditorProps) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? "");

  // Keep selection valid as the template list changes
  useEffect(() => {
    if (!templates.find((t) => t.id === selectedId)) {
      setSelectedId(templates[0]?.id ?? "");
    }
  }, [templates, selectedId]);

  const selected = templates.find((t) => t.id === selectedId);

  function addTemplate() {
    const now = new Date().toISOString();
    const nextStep = templates.length === 0
      ? 0
      : Math.max(...templates.map((t) => t.step)) + 1;
    const fresh: EmailTemplate = {
      id: newId("tmpl"),
      name: `New template ${templates.length + 1}`,
      subject: "Re: {{organization}}",
      body: "Hi {{firstName}},\n\n\n\nBest,\n{{senderName}}",
      step: nextStep,
      createdAt: now,
      updatedAt: now,
    };
    onChange([...templates, fresh]);
    setSelectedId(fresh.id);
  }

  function updateSelected(patch: Partial<EmailTemplate>) {
    if (!selected) return;
    onChange(
      templates.map((t) =>
        t.id === selected.id
          ? { ...t, ...patch, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }

  function deleteSelected() {
    if (!selected) return;
    if (!confirm(`Delete template "${selected.name}"?`)) return;
    onChange(templates.filter((t) => t.id !== selected.id));
  }

  function insertField(field: string) {
    if (!selected) return;
    const placeholder = `{{${field}}}`;
    // Append at the end of the body — simple but predictable
    updateSelected({ body: selected.body + placeholder });
  }

  return (
    <div className="grid grid-cols-[240px_1fr] gap-5">
      {/* Sidebar list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
            Templates ({templates.length})
          </h3>
          <button
            onClick={addTemplate}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-ink/5 text-ink-muted hover:text-ink"
          >
            <Plus size={11} /> New
          </button>
        </div>
        <div className="space-y-1">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left px-3 py-2 rounded text-[12px] border transition-colors ${
                t.id === selectedId
                  ? "bg-paper-card border-ink/20 text-ink"
                  : "bg-transparent border-transparent text-ink-muted hover:bg-ink/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{t.name}</span>
              </div>
              <div className="text-[10px] font-mono text-ink-muted mt-0.5">
                Step {t.step + 1}
              </div>
            </button>
          ))}
          {templates.length === 0 && (
            <div className="text-[11px] text-ink-muted py-3 text-center">
              No templates yet.
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="bg-paper-card border border-ink/10 rounded-lg p-5">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end mb-4">
            <label className="block">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Name
              </span>
              <input
                type="text"
                value={selected.name}
                onChange={(e) => updateSelected({ name: e.target.value })}
                className="w-full text-[13px] bg-paper border border-ink/10 rounded px-2 py-1.5 focus:outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
                Step
              </span>
              <input
                type="number"
                min={0}
                value={selected.step}
                onChange={(e) => updateSelected({ step: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                className="w-20 text-[13px] tabular-nums bg-paper border border-ink/10 rounded px-2 py-1.5 focus:outline-none focus:border-accent"
              />
            </label>
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded text-rust hover:bg-rust/5"
            >
              <Trash size={12} /> Delete
            </button>
          </div>

          <label className="block mb-4">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Subject
            </span>
            <input
              type="text"
              value={selected.subject}
              onChange={(e) => updateSelected({ subject: e.target.value })}
              className="w-full text-[13px] bg-paper border border-ink/10 rounded px-2 py-1.5 focus:outline-none focus:border-accent"
            />
          </label>

          <label className="block mb-2">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1">
              Body
            </span>
            <textarea
              value={selected.body}
              onChange={(e) => updateSelected({ body: e.target.value })}
              rows={12}
              className="w-full text-[13px] font-mono bg-paper border border-ink/10 rounded px-2 py-2 focus:outline-none focus:border-accent leading-relaxed"
            />
          </label>

          {/* Merge field shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap mb-5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mr-1">
              Insert:
            </span>
            {MERGE_FIELDS.map((f) => (
              <button
                key={f}
                onClick={() => insertField(f)}
                className="text-[11px] font-mono px-2 py-0.5 rounded border border-ink/10 hover:bg-ink/5 text-ink-muted hover:text-ink"
              >
                {`{{${f}}}`}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 flex items-center gap-2">
              Preview
              {sampleContact && (
                <span className="text-[10px] normal-case tracking-normal text-ink-faint">
                  · merged with {sampleContact.contactName || sampleContact.organization}
                </span>
              )}
            </div>
            {sampleContact ? (
              <Preview
                template={selected}
                contact={sampleContact}
                senderName={senderName}
              />
            ) : (
              <div className="text-[12px] text-ink-muted bg-paper border border-ink/10 rounded p-3">
                Add a contact on the Board to see a merged preview here.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-paper-card border border-ink/10 rounded-lg p-8 text-center text-ink-muted">
          <FileText size={24} className="mx-auto opacity-40" />
          <p className="mt-3 text-[13px]">No template selected.</p>
          <p className="text-[11px] mt-1">Create one with the "+ New" button.</p>
        </div>
      )}
    </div>
  );
}

function Preview({
  template,
  contact,
  senderName,
}: {
  template: EmailTemplate;
  contact: Contact;
  senderName: string;
}) {
  const rendered = renderTemplate(template, { contact, senderName });
  return (
    <div className="bg-paper border border-ink/10 rounded p-3 space-y-2">
      <div className="text-[12px]">
        <span className="text-ink-muted">Subject: </span>
        <span className="text-ink font-medium">{rendered.subject}</span>
      </div>
      <pre className="text-[12px] font-mono whitespace-pre-wrap text-ink leading-relaxed">
        {rendered.body}
      </pre>
    </div>
  );
}
