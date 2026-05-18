import {
  Contact,
  Sequence,
  SentMessage,
  SEQUENCE_ACTIVE_STATUSES,
} from "@/lib/types";

export type QueueBucket = "overdue" | "due_today" | "upcoming" | "no_more_steps";

export interface QueueItem {
  contact: Contact;
  sequence: Sequence;
  nextStepIndex: number;     // index into sequence.steps for the next email
  dueAt: string;             // ISO date string when this step becomes due
  daysUntilDue: number;      // negative = overdue, 0 = today, positive = future
  bucket: QueueBucket;
  prior: SentMessage[];      // messages already sent to this contact, in order
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * For each contact, figure out which sequence step (if any) is next due.
 *
 * Rules:
 *   - If the contact has replied to any prior message → stop (no item).
 *   - If contact.status is outside SEQUENCE_ACTIVE_STATUSES AND there's already
 *     been a send → stop.
 *   - If no prior sends exist, step 0 is due now (offset from "today" only matters
 *     once the first send happens).
 *   - Otherwise the next step's dueAt = lastSentAt + sequence.steps[nextStep].offsetDays.
 */
export function computeQueue(args: {
  contacts: Contact[];
  messages: SentMessage[];
  sequences: Sequence[];
  defaultSequenceId?: string;
  now?: Date;
}): QueueItem[] {
  const now = args.now ?? new Date();
  const today = startOfDay(now);

  const seqById = new Map(args.sequences.map((s) => [s.id, s]));
  const defaultSeq =
    (args.defaultSequenceId && seqById.get(args.defaultSequenceId)) ||
    args.sequences[0];

  if (!defaultSeq) return [];

  const messagesByContact = new Map<string, SentMessage[]>();
  for (const m of args.messages) {
    const arr = messagesByContact.get(m.contactId) ?? [];
    arr.push(m);
    messagesByContact.set(m.contactId, arr);
  }
  for (const arr of messagesByContact.values()) {
    arr.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  }

  const out: QueueItem[] = [];

  for (const c of args.contacts) {
    const sequence =
      (c.id && seqById.get((c as any).sequenceId ?? "")) || defaultSeq;
    const prior = messagesByContact.get(c.id) ?? [];

    // Stop if any reply came in.
    if (prior.some((m) => m.replied)) continue;

    // If contact has moved out of the active set AND we've already sent at
    // least once, stop. (For status "Not Started" / "Researching" we'll still
    // suggest the initial cold email.)
    if (prior.length > 0 && !SEQUENCE_ACTIVE_STATUSES.includes(c.status)) {
      continue;
    }

    // Also stop on terminal statuses regardless.
    if (
      c.status === "Closed Won" ||
      c.status === "Closed Lost" ||
      c.status === "Nurture"
    ) {
      continue;
    }

    const nextStepIndex = prior.length;
    if (nextStepIndex >= sequence.steps.length) {
      out.push({
        contact: c,
        sequence,
        nextStepIndex,
        dueAt: today.toISOString(),
        daysUntilDue: 0,
        bucket: "no_more_steps",
        prior,
      });
      continue;
    }

    const step = sequence.steps[nextStepIndex];
    let dueAt: Date;
    if (prior.length === 0) {
      // First touch — due immediately (any time the user opens dashboard).
      dueAt = today;
    } else {
      const last = prior[prior.length - 1];
      dueAt = startOfDay(addDays(new Date(last.sentAt), step.offsetDays));
    }

    const daysUntilDue = daysBetween(dueAt, today); // negative = overdue
    let bucket: QueueBucket;
    if (daysUntilDue < 0) bucket = "overdue";
    else if (daysUntilDue === 0) bucket = "due_today";
    else bucket = "upcoming";

    out.push({
      contact: c,
      sequence,
      nextStepIndex,
      dueAt: dueAt.toISOString(),
      daysUntilDue,
      bucket,
      prior,
    });
  }

  // Sort: most overdue first, then by org name.
  out.sort((a, b) => {
    if (a.daysUntilDue !== b.daysUntilDue) return a.daysUntilDue - b.daysUntilDue;
    return a.contact.organization.localeCompare(b.contact.organization);
  });

  return out;
}

export function dueCount(items: QueueItem[]): number {
  return items.filter((i) => i.bucket === "overdue" || i.bucket === "due_today")
    .length;
}
