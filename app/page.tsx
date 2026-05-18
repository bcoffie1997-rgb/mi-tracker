"use client";

import { useEffect, useMemo, useState } from "react";
import { Contact, Status } from "@/lib/types";
import {
  loadContacts,
  saveContacts,
  exportData,
  importData,
  resetToSeed,
} from "@/lib/storage";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ContactDetail } from "@/components/ContactDetail";
import { NewContactModal } from "@/components/NewContactModal";
import { Dashboard } from "@/components/Dashboard";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { Plus, Download, Upload, Trash } from "@/components/Icons";

export default function HomePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    tier: "all",
    category: "all",
    owner: "all",
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    setContacts(loadContacts());
    setHydrated(true);
  }, []);

  // Persist whenever contacts change (but only after hydration)
  useEffect(() => {
    if (hydrated) saveContacts(contacts);
  }, [contacts, hydrated]);

  // Selected contact lookup
  const selected = selectedId ? contacts.find((c) => c.id === selectedId) ?? null : null;

  // Filtered contacts feed the board
  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filters.tier !== "all" && c.tier !== filters.tier) return false;
      if (filters.category !== "all" && c.category !== filters.category) return false;
      if (filters.owner !== "all" && c.owner !== filters.owner) return false;
      if (q) {
        const blob = `${c.organization} ${c.subOrg} ${c.contactName} ${c.title} ${c.notes} ${c.outreachHook} ${c.location}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [contacts, filters]);

  function handleStatusChange(id: string, newStatus: Status) {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: newStatus,
              lastTouch: ["Outreach Sent", "Responded", "Discovery Call", "Pilot Active", "Proposal Sent"].includes(newStatus)
                ? new Date().toISOString()
                : c.lastTouch,
              firstTouch: c.firstTouch || (newStatus === "Outreach Sent" ? new Date().toISOString() : ""),
              touches: newStatus === "Outreach Sent" && c.status === "Not Started" ? c.touches + 1 : c.touches,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }

  function handleSave(updated: Contact) {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function handleCreate(newContact: Contact) {
    setContacts((prev) => [newContact, ...prev]);
    setShowNew(false);
    setSelectedId(newContact.id);
  }

  function handleDelete(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setSelectedId(null);
  }

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mi-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const result = importData(text);
      if (result.ok) {
        setContacts(loadContacts());
        alert(result.message);
      } else {
        alert(`Import failed: ${result.message}`);
      }
    };
    input.click();
    setShowMenu(false);
  }

  function handleReset() {
    resetToSeed();
    setContacts(loadContacts());
    setShowResetConfirm(false);
    setShowMenu(false);
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
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-ink text-paper flex items-center justify-center serif-display text-sm font-medium">
              MI
            </div>
            <div>
              <h1 className="serif-display text-[15px] font-medium tracking-tighter leading-none">
                Enterprise Pipeline
              </h1>
              <div className="text-[10px] text-ink-muted font-mono uppercase tracking-wider mt-0.5">
                Market Assassin · SaaS
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 ml-6 text-[12px]">
            <span className="nav-active text-ink font-medium px-1 py-1">Board</span>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded bg-ink text-paper hover:bg-ink/90 transition-colors font-medium"
            >
              <Plus size={13} />
              New contact
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-[12px] px-2 py-1.5 rounded hover:bg-ink/5 text-ink-muted hover:text-ink"
              >
                ⋯
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-paper border border-ink/10 rounded shadow-cardHover py-1 min-w-[180px] z-50">
                    <button onClick={handleExport} className="w-full text-left px-3 py-1.5 text-[12px] text-ink hover:bg-ink/5 flex items-center gap-2">
                      <Download size={12} /> Export JSON
                    </button>
                    <button onClick={handleImport} className="w-full text-left px-3 py-1.5 text-[12px] text-ink hover:bg-ink/5 flex items-center gap-2">
                      <Upload size={12} /> Import JSON
                    </button>
                    <div className="my-1 h-px bg-ink/10" />
                    <button onClick={() => { setShowResetConfirm(true); setShowMenu(false); }} className="w-full text-left px-3 py-1.5 text-[12px] text-rust hover:bg-rust/5 flex items-center gap-2">
                      <Trash size={12} /> Reset to seed data
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-5">
        {/* Page intro */}
        <div className="mb-5">
          <h2 className="serif-display text-3xl font-medium tracking-tighter text-ink leading-tight">
            Pipeline.
          </h2>
          <p className="text-[13px] text-ink-muted mt-1 max-w-2xl">
            Drag cards between columns to update status. Click any card to open details.
            Memo target — <span className="font-mono">$500K Y1 ARR · 8-12 enterprise customers · 40%+ pilot conversion</span>.
          </p>
        </div>

        {/* Dashboard strip */}
        <Dashboard contacts={contacts} />

        {/* Filters */}
        <div className="mt-5 mb-3">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            resultCount={filtered.length}
            totalCount={contacts.length}
          />
        </div>

        {/* Kanban */}
        <KanbanBoard
          contacts={filtered}
          onStatusChange={handleStatusChange}
          onCardClick={(id) => setSelectedId(id)}
        />
      </div>

      {/* Detail panel */}
      {selected && (
        <ContactDetail
          contact={selected}
          onClose={() => setSelectedId(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* New contact modal */}
      {showNew && (
        <NewContactModal onClose={() => setShowNew(false)} onCreate={handleCreate} />
      )}

      {/* Reset confirm */}
      {showResetConfirm && (
        <>
          <div className="fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-40 overlay-fade" onClick={() => setShowResetConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-paper border border-ink/10 rounded-lg w-full max-w-sm shadow-cardHover pointer-events-auto overlay-fade p-5">
              <h2 className="serif-display text-lg font-medium tracking-tighter">Reset to seed data?</h2>
              <p className="text-[13px] text-ink-muted mt-1.5">
                This will replace all current contacts with the original 28 researched contacts.
                Your changes will be lost (unless you export first).
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowResetConfirm(false)} className="text-[12px] px-3 py-1.5 rounded text-ink-muted hover:bg-ink/5">
                  Cancel
                </button>
                <button onClick={handleReset} className="text-[12px] px-3 py-1.5 rounded bg-rust text-paper hover:bg-rust/90 font-medium">
                  Yes, reset
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
