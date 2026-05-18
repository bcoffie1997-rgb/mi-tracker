import { Contact, ActivityLogEntry } from "./types";
import { SEED_CONTACTS } from "./seed";

const CONTACTS_KEY = "mi-tracker:contacts:v1";
const ACTIVITY_KEY = "mi-tracker:activity:v1";
const SEEDED_FLAG = "mi-tracker:seeded:v1";

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

export function exportData(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    contacts: loadContacts(),
    activity: loadActivity(),
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
    if (parsed.activity && Array.isArray(parsed.activity)) {
      saveActivity(parsed.activity);
    }
    return { ok: true, message: `Imported ${parsed.contacts.length} contacts.` };
  } catch (e) {
    return { ok: false, message: "Invalid JSON file." };
  }
}

export function resetToSeed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONTACTS_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
  localStorage.removeItem(SEEDED_FLAG);
}

export function newId(prefix: string = "e"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
