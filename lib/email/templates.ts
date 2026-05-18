import { Contact, EmailTemplate, MergeField } from "@/lib/types";

export interface RenderContext {
  contact: Contact;
  senderName: string;
}

function splitName(full: string): { first: string; last: string } {
  const trimmed = (full ?? "").trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  return {
    first: parts[0] ?? "",
    last: parts.slice(1).join(" "),
  };
}

export function mergeFieldValue(field: MergeField, ctx: RenderContext): string {
  const { contact, senderName } = ctx;
  const { first, last } = splitName(contact.contactName);
  switch (field) {
    case "firstName":    return first || "there";
    case "lastName":     return last;
    case "contactName":  return contact.contactName;
    case "organization": return contact.organization;
    case "subOrg":       return contact.subOrg;
    case "title":        return contact.title;
    case "outreachHook": return contact.outreachHook;
    case "senderName":   return senderName || "Branden";
  }
}

const FIELD_PATTERN = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

export function renderString(raw: string, ctx: RenderContext): string {
  return raw.replace(FIELD_PATTERN, (_match, field: string) => {
    return mergeFieldValue(field as MergeField, ctx);
  });
}

export interface RenderedTemplate {
  subject: string;
  body: string;
}

export function renderTemplate(tmpl: EmailTemplate, ctx: RenderContext): RenderedTemplate {
  return {
    subject: renderString(tmpl.subject, ctx),
    body:    renderString(tmpl.body, ctx),
  };
}

// Build a Gmail compose URL — useful as the "Send" stub until OAuth is wired up.
// Spec: https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...
export function gmailComposeUrl(args: { to: string; subject: string; body: string }): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: args.to,
    su: args.subject,
    body: args.body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}
