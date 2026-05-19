import {
  Contact,
  ActivityLogEntry,
  EmailTemplate,
  Sequence,
  SentMessage,
  DEFAULT_TEMPLATES,
  DEFAULT_SEQUENCES,
} from "./types";
import { SEED_CONTACTS } from "./seed";

const CONTACTS_KEY  = "mi-tracker:contacts:v1";
const ACTIVITY_KEY  = "mi-tracker:activity:v1";
const TEMPLATES_KEY = "mi-tracker:templates:v1";
const SEQUENCES_KEY = "mi-tracker:sequences:v1";
const MESSAGES_KEY  = "mi-tracker:messages:v1";
const SENDER_KEY    = "mi-tracker:sender:v1";
const VIEW_KEY      = "mi-tracker:view:v1";
const SEEDED_FLAG   = "mi-tracker:seeded:v1";

export type ViewMode = "kanban" | "table" | "grouped";
const DEFAULT_VIEW: ViewMode = "kanban";

function nowIso(): string {
  return new Date().toISOString();
}

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const seeded = localStorage.getItem(SEEDED_FLAG);
    if (!seeded) {
      // First load — seed the data
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(SEED_CONTACTS));
      localStorage.setItem(SEEDED_FLAG, "true");
      return SEED_CONTACTS;
    }
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Contact[];
  } catch (e) {
    console.error("Failed to load contacts", e);
    return [];
  }
}

export function saveContacts(contacts: Contact[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.error("Failed to save contacts", e);
  }
}

export function loadActivity(): ActivityLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ActivityLogEntry[];
  } catch {
    return [];
  }
}

export function saveActivity(entries: ActivityLogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to save activity", e);
  }
}

// ── Templates ─────────────────────────────────────────────────────────────

export function loadTemplates(): EmailTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) {
      const seeded = DEFAULT_TEMPLATES.map((t) => ({
        ...t,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }));
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as EmailTemplate[];
  } catch (e) {
    console.error("Failed to load templates", e);
    return [];
  }
}

export function saveTemplates(templates: EmailTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error("Failed to save templates", e);
  }
}

// ── Sequences ─────────────────────────────────────────────────────────────

export function loadSequences(): Sequence[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEQUENCES_KEY);
    if (!raw) {
      const seeded = DEFAULT_SEQUENCES.map((s) => ({
        ...s,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }));
      localStorage.setItem(SEQUENCES_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Sequence[];
  } catch (e) {
    console.error("Failed to load sequences", e);
    return [];
  }
}

export function saveSequences(sequences: Sequence[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEQUENCES_KEY, JSON.stringify(sequences));
  } catch (e) {
    console.error("Failed to save sequences", e);
  }
}

// ── Sent messages ─────────────────────────────────────────────────────────

export function loadMessages(): SentMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SentMessage[];
  } catch {
    return [];
  }
}

export function saveMessages(messages: SentMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error("Failed to save messages", e);
  }
}

// ── Sender identity (name used for {{senderName}} merge field) ────────────

export function loadSenderName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SENDER_KEY) ?? "";
}

export function saveSenderName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SENDER_KEY, name);
}

// ── Tracking-page view mode (kanban / table / grouped) ────────────────────

export function loadViewMode(): ViewMode {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const raw = localStorage.getItem(VIEW_KEY);
  if (raw === "kanban" || raw === "table" || raw === "grouped") return raw;
  return DEFAULT_VIEW;
}

export function saveViewMode(mode: ViewMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(VIEW_KEY, mode);
}

// ── Export / import / reset ───────────────────────────────────────────────

export function exportData(): string {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    contacts: loadContacts(),
    activity: loadActivity(),
    templates: loadTemplates(),
    sequences: loadSequences(),
    messages: loadMessages(),
    senderName: loadSenderName(),
  };
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): { ok: boolean; message: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.contacts || !Array.isArray(parsed.contacts)) {
      return { ok: false, message: "Invalid file: no contacts array found." };
    }
    saveContacts(parsed.contacts);
    if (Array.isArray(parsed.activity))  saveActivity(parsed.activity);
    if (Array.isArray(parsed.templates)) saveTemplates(parsed.templates);
    if (Array.isArray(parsed.sequences)) saveSequences(parsed.sequences);
    if (Array.isArray(parsed.messages))  saveMessages(parsed.messages);
    if (typeof parsed.senderName === "string") saveSenderName(parsed.senderName);
    return { ok: true, message: `Imported ${parsed.contacts.length} contacts.` };
  } catch (e) {
    return { ok: false, message: "Invalid JSON file." };
  }
}

export function resetToSeed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONTACTS_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
  localStorage.removeItem(TEMPLATES_KEY);
  localStorage.removeItem(SEQUENCES_KEY);
  localStorage.removeItem(MESSAGES_KEY);
  localStorage.removeItem(SEEDED_FLAG);
}

export function newId(prefix: string = "e"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
