"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Contact, Status, BOARD_COLUMNS, STATUS_COLORS, TIER_COLORS, DEAL_MIDPOINTS } from "@/lib/types";
import { Mail, Phone, Link as LinkIcon, ExternalLink, Sparkles, Clock } from "./Icons";

interface KanbanBoardProps {
  contacts: Contact[];
  onStatusChange: (id: string, newStatus: Status) => void;
  onCardClick: (id: string) => void;
}

export function KanbanBoard({ contacts, onStatusChange, onCardClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const grouped: Record<Status, Contact[]> = {} as Record<Status, Contact[]>;
  BOARD_COLUMNS.forEach((s) => (grouped[s] = []));
  // Also collect non-board statuses (Closed Lost, Nurture) so they don't disappear
  grouped["Closed Lost"] = [];
  grouped["Nurture"] = [];
  contacts.forEach((c) => {
    if (grouped[c.status]) grouped[c.status].push(c);
    else grouped[c.status] = [c];
  });

  const activeContact = activeId ? contacts.find((c) => c.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = over.id as Status;
    const contact = contacts.find((c) => c.id === active.id);
    if (!contact || contact.status === newStatus) return;
    onStatusChange(active.id as string, newStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 px-6 -mx-6 min-h-[calc(100vh-200px)]">
        {BOARD_COLUMNS.map((status) => (
          <Column
            key={status}
            status={status}
            contacts={grouped[status]}
            onCardClick={onCardClick}
          />
        ))}

        {/* Hidden columns — Closed Lost & Nurture shown only if populated */}
        {grouped["Nurture"].length > 0 && (
          <Column status="Nurture" contacts={grouped["Nurture"]} onCardClick={onCardClick} muted />
        )}
        {grouped["Closed Lost"].length > 0 && (
          <Column status="Closed Lost" contacts={grouped["Closed Lost"]} onCardClick={onCardClick} muted />
        )}
      </div>

      <DragOverlay>
        {activeContact ? (
          <div className="rotate-[-1.5deg] opacity-95">
            <Card contact={activeContact} onClick={() => {}} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface ColumnProps {
  status: Status;
  contacts: Contact[];
  onCardClick: (id: string) => void;
  muted?: boolean;
}

function Column({ status, contacts, onCardClick, muted }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const pipelineValue = contacts.reduce((sum, c) => sum + (DEAL_MIDPOINTS[c.dealSize] ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-[280px] rounded-lg border transition-colors ${
        isOver
          ? "border-accent/40 bg-accent/[0.03]"
          : muted
          ? "border-ink/5 bg-paper-soft/30"
          : "border-ink/10 bg-paper-soft/50"
      }`}
    >
      <div className="px-3 pt-3 pb-2 sticky top-0 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: STATUS_COLORS[status] }}
          />
          <h3 className="font-display font-medium text-[13px] text-ink tracking-tightish">{status}</h3>
          <span className="ml-auto text-[11px] font-mono text-ink-muted tabular-nums">
            {contacts.length}
          </span>
        </div>
        {pipelineValue > 0 && (
          <div className="text-[10px] text-ink-muted font-mono tracking-wide tabular-nums">
            ${(pipelineValue / 1000).toFixed(0)}K potential
          </div>
        )}
      </div>

      <div className="px-2 pb-2 space-y-2 min-h-[120px] max-h-[calc(100vh-260px)] overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="text-center text-[11px] text-ink-faint py-8 italic">
            no contacts
          </div>
        ) : (
          contacts.map((c) => (
            <DraggableCard key={c.id} contact={c} onClick={() => onCardClick(c.id)} />
          ))
        )}
      </div>
    </div>
  );
}

interface DraggableCardProps {
  contact: Contact;
  onClick: () => void;
}

function DraggableCard({ contact, onClick }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: contact.id });

  return (
    <div ref={setNodeRef} className={isDragging ? "opacity-30" : ""}>
      <Card contact={contact} onClick={onClick} listeners={listeners} attributes={attributes} />
    </div>
  );
}

interface CardProps {
  contact: Contact;
  onClick: () => void;
  listeners?: any;
  attributes?: any;
  dragging?: boolean;
}

function Card({ contact, onClick, listeners, attributes, dragging }: CardProps) {
  const initials = contact.contactName
    ? contact.contactName
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const daysSinceLastTouch = contact.lastTouch
    ? Math.floor((Date.now() - new Date(contact.lastTouch).getTime()) / 86400000)
    : null;
  const overdue = contact.nextActionDate && new Date(contact.nextActionDate) < new Date();

  return (
    <div
      className={`group bg-paper-card border border-ink/10 rounded-md p-2.5 cursor-grab active:cursor-grabbing card-shadow ${
        dragging ? "shadow-cardHover" : ""
      }`}
      onClick={(e) => {
        // Only treat as click if it's an actual click (not a drag)
        if (!dragging) onClick();
      }}
      {...listeners}
      {...attributes}
    >
      {/* Tier strip */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[9px] font-mono uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-sm"
          style={{
            background: `${TIER_COLORS[contact.tier]}15`,
            color: TIER_COLORS[contact.tier],
          }}
        >
          {contact.tier}
        </span>
        {contact.email && (
          <span className="text-[10px] text-sage" title="Verified email">●</span>
        )}
      </div>

      {/* Org name */}
      <h4 className="font-display text-[13px] leading-tight text-ink font-medium mb-1 line-clamp-2 tracking-tightish">
        {contact.organization}
      </h4>

      {/* Sub-org / location */}
      {contact.subOrg && (
        <p className="text-[10px] text-ink-muted mb-2 line-clamp-1">{contact.subOrg}</p>
      )}

      {/* Contact name + initials */}
      <div className="flex items-center gap-2 mt-2 pb-2 border-b border-ink/5">
        <div className="w-5 h-5 rounded-full bg-ink/5 text-ink-soft text-[9px] font-mono font-medium flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium text-ink-soft truncate">
            {contact.contactName || "(no contact)"}
          </div>
        </div>
      </div>

      {/* Bottom: deal size + next action */}
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="font-mono text-ink-muted tabular-nums">
          {contact.dealSize === "Referral" ? "ref" : contact.dealSize}
        </span>
        {contact.owner && (
          <span className="text-ink-faint">{contact.owner}</span>
        )}
      </div>

      {(overdue || (daysSinceLastTouch !== null && daysSinceLastTouch > 14)) && (
        <div className="mt-2 pt-2 border-t border-ink/5 flex items-center gap-1 text-[10px] text-rust">
          <Clock size={10} />
          <span>
            {overdue
              ? "next action overdue"
              : `${daysSinceLastTouch}d since last touch`}
          </span>
        </div>
      )}
    </div>
  );
}
