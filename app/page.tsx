"use client";

import { useEffect, useMemo, useState } from "react";
import { Contact, Status } from "@/lib/types";
import {
  loadContacts,
  saveContacts,
  loadViewMode,
  saveViewMode,
  ViewMode,
} from "@/lib/storage";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TableView } from "@/components/TableView";
import { GroupedView } from "@/components/GroupedView";
import { ViewSwitcher } from "@/components/ViewSwitcher";
import { ContactDetail } from "@/components/ContactDetail";
import { NewContactModal } from "@/components/NewContactModal";
import { Dashboard } from "@/components/Dashboard";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { TopBar } from "@/components/TopBar";
import { Plus } from "@/components/Icons";

export default function HomePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    tier: "all",
    category: "all",
    owner: "all",
  });
  const [view, setView] = useState<ViewMode>("kanban");

  // Hydrate from localStorage on mount
  useEffect(() => {
    setContacts(loadContacts());
    setView(loadViewMode());
    setHydrated(true);
  }, []);

  // Persist whenever contacts change (but only after hydration)
  useEffect(() => {
    if (hydrated) saveContacts(contacts);
  }, [contacts, hydrated]);

  useEffect(() => {
    if (hydrated) saveViewMode(view);
  }, [view, hydrated]);

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
        activePage="board"
        onDataReplaced={() => setContacts(loadContacts())}
        actions={
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded bg-ink text-paper hover:bg-ink/90 transition-colors font-medium"
          >
            <Plus size={13} />
            New contact
          </button>
        }
      />

      <div className="max-w-[1400px] mx-auto px-6 py-5">
        {/* Page intro */}
        <div className="mb-5">
          <h2 className="serif-display text-2xl font-semibold tracking-tighter text-ink leading-tight">
            Pipeline
          </h2>
          <p className="text-[13px] text-ink-muted mt-1 max-w-2xl">
            Drag cards between columns to update status. Click any card to open details.
            Memo target — <span className="font-mono">$500K Y1 ARR · 8-12 enterprise customers · 40%+ pilot conversion</span>.
          </p>
        </div>

        {/* Dashboard strip */}
        <Dashboard contacts={contacts} />

        {/* Filters + view switcher */}
        <div className="mt-5 mb-3 flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <FilterBar
              filters={filters}
              onChange={setFilters}
              resultCount={filtered.length}
              totalCount={contacts.length}
            />
          </div>
          <ViewSwitcher value={view} onChange={setView} />
        </div>

        {/* Active view */}
        {view === "kanban" && (
          <KanbanBoard
            contacts={filtered}
            onStatusChange={handleStatusChange}
            onCardClick={(id) => setSelectedId(id)}
          />
        )}
        {view === "table" && (
          <TableView
            contacts={filtered}
            onCardClick={(id) => setSelectedId(id)}
          />
        )}
        {view === "grouped" && (
          <GroupedView
            contacts={filtered}
            onCardClick={(id) => setSelectedId(id)}
          />
        )}
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
    </main>
  );
}
