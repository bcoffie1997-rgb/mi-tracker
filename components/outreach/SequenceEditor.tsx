"use client";

import { useEffect, useState } from "react";
import { EmailTemplate, Sequence } from "@/lib/types";
import { newId } from "@/lib/storage";
import { Plus, Trash, Mail } from "@/components/Icons";

interface SequenceEditorProps {
  sequences: Sequence[];
  templates: EmailTemplate[];
  onChange: (next: Sequence[]) => void;
}

export function SequenceEditor({ sequences, templates, onChange }: SequenceEditorProps) {
  const [selectedId, setSelectedId] = useState<string>(sequences[0]?.id ?? "");

  useEffect(() => {
    if (!sequences.find((s) => s.id === selectedId)) {
      setSelectedId(sequences[0]?.id ?? "");
    }
  }, [sequences, selectedId]);

  const selected = sequences.find((s) => s.id === selectedId);

  function addSequence() {
    const now = new Date().toISOString();
    const fresh: Sequence = {
      id: newId("seq"),
      name: `New sequence ${sequences.length + 1}`,
      steps: [],
      createdAt: now,
      updatedAt: now,
    };
    onChange([...sequences, fresh]);
    setSelectedId(fresh.id);
  }

  function updateSelected(patch: Partial<Sequence>) {
    if (!selected) return;
    onChange(
      sequences.map((s) =>
        s.id === selected.id
          ? { ...s, ...patch, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }

  function deleteSelected() {
    if (!selected) return;
    if (!confirm(`Delete sequence "${selected.name}"?`)) return;
    onChange(sequences.filter((s) => s.id !== selected.id));
  }

  function updateStep(idx: number, patch: { offsetDays?: number; templateId?: string }) {
    if (!selected) return;
    const steps = selected.steps.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    updateSelected({ steps });
  }

  function addStep() {
    if (!selected) return;
    const fallbackTemplate = templates[0]?.id ?? "";
    updateSelected({
      steps: [
        ...selected.steps,
        { offsetDays: 3, templateId: fallbackTemplate },
      ],
    });
  }

  function removeStep(idx: number) {
    if (!selected) return;
    updateSelected({ steps: selected.steps.filter((_, i) => i !== idx) });
  }

  return (
    <div className="grid grid-cols-[240px_1fr] gap-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
            Sequences ({sequences.length})
          </h3>
          <button
            onClick={addSequence}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-ink/5 text-ink-muted hover:text-ink"
          >
            <Plus size={11} /> New
          </button>
        </div>
        <div className="space-y-1">
          {sequences.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className={`w-full text-left px-3 py-2 rounded text-[12px] border transition-colors ${
                s.id === selectedId
                  ? "bg-paper-card border-ink/20 text-ink"
                  : "bg-transparent border-transparent text-ink-muted hover:bg-ink/5"
              }`}
            >
              <div className="font-medium truncate">{s.name}</div>
              <div className="text-[10px] font-mono text-ink-muted mt-0.5">
                {s.steps.length} step{s.steps.length === 1 ? "" : "s"}
              </div>
            </button>
          ))}
          {sequences.length === 0 && (
            <div className="text-[11px] text-ink-muted py-3 text-center">
              No sequences yet.
            </div>
          )}
        </div>
      </div>

      {selected ? (
        <div className="bg-paper-card border border-ink/10 rounded-lg p-5">
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end mb-4">
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
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded text-rust hover:bg-rust/5"
            >
              <Trash size={12} /> Delete
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                Steps
              </h4>
              <button
                onClick={addStep}
                disabled={templates.length === 0}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-ink/5 text-ink-muted hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={11} /> Add step
              </button>
            </div>

            {selected.steps.length === 0 ? (
              <div className="text-[12px] text-ink-muted bg-paper border border-ink/10 rounded p-4 text-center">
                No steps yet. Click "Add step" to define your cadence.
              </div>
            ) : (
              <div className="space-y-2">
                {selected.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[40px_120px_1fr_auto] gap-2 items-center bg-paper border border-ink/10 rounded p-2"
                  >
                    <div className="text-[11px] font-mono text-ink-muted text-center">
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={step.offsetDays}
                        onChange={(e) =>
                          updateStep(idx, {
                            offsetDays: Math.max(0, parseInt(e.target.value || "0", 10)),
                          })
                        }
                        className="w-16 text-[12px] tabular-nums bg-paper-card border border-ink/10 rounded px-2 py-1 focus:outline-none focus:border-accent"
                      />
                      <span className="text-[11px] text-ink-muted">days</span>
                    </div>
                    <select
                      value={step.templateId}
                      onChange={(e) => updateStep(idx, { templateId: e.target.value })}
                      className="text-[12px] bg-paper-card border border-ink/10 rounded px-2 py-1 focus:outline-none focus:border-accent"
                    >
                      <option value="">— pick a template —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeStep(idx)}
                      className="p-1.5 rounded hover:bg-rust/5 text-ink-muted hover:text-rust"
                      aria-label="Remove step"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-ink-muted mt-3 leading-relaxed">
              <span className="font-mono">offsetDays</span> on step 1 is ignored (the
              first send fires whenever you click Draft). For later steps, it counts
              from the previous send.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-paper-card border border-ink/10 rounded-lg p-8 text-center text-ink-muted">
          <Mail size={24} className="mx-auto opacity-40" />
          <p className="mt-3 text-[13px]">No sequence selected.</p>
          <p className="text-[11px] mt-1">Create one with the "+ New" button.</p>
        </div>
      )}
    </div>
  );
}
