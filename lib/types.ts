export type Status =
  | "Not Started"
  | "Researching"
  | "Outreach Sent"
  | "Responded"
  | "Discovery Call"
  | "Pilot Active"
  | "Proposal Sent"
  | "Negotiating"
  | "Closed Won"
  | "Closed Lost"
  | "Nurture";

export type Tier = "Tier 1" | "Tier 2" | "Tier 3" | "Channel";

export type Owner = "Branden" | "Eric" | "Joint" | "TBD";

export type Category =
  | "APEX Accelerator"
  | "VBOC"
  | "SBDC"
  | "MBDA Center"
  | "Veteran Member Association"
  | "8(a) Association"
  | "HUBZone Association"
  | "WOSB Association"
  | "Trade Association"
  | "Tribal 8(a)"
  | "Mentor-Protege JV"
  | "Channel Partner"
  | "University Federal Office"
  | "State Procurement Office"
  | "Existing Customer";

export interface Contact {
  id: string;
  tier: Tier;
  category: Category;
  organization: string;
  subOrg: string;
  contactName: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  orgUrl: string;
  location: string;
  dealSize: string;
  status: Status;
  firstTouch: string;     // ISO date string
  lastTouch: string;      // ISO date string
  touches: number;
  nextAction: string;
  nextActionDate: string; // ISO date string
  outreachHook: string;
  owner: Owner;
  notes: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  contactId: string;
  date: string;
  type: "Cold Email" | "LinkedIn Msg" | "Follow-up Email" | "Phone Call" | "Zoom Discovery" | "Zoom Demo" | "Pilot Check-in" | "Proposal Send" | "Negotiation" | "Contract Sign" | "Other";
  direction: "Outbound" | "Inbound";
  subject: string;
  outcome: string;
  nextStep: string;
  owner: Owner;
}

export const STATUSES: Status[] = [
  "Not Started",
  "Researching",
  "Outreach Sent",
  "Responded",
  "Discovery Call",
  "Pilot Active",
  "Proposal Sent",
  "Negotiating",
  "Closed Won",
  "Closed Lost",
  "Nurture",
];

// Kanban columns — order matters
export const BOARD_COLUMNS: Status[] = [
  "Not Started",
  "Researching",
  "Outreach Sent",
  "Responded",
  "Discovery Call",
  "Pilot Active",
  "Proposal Sent",
  "Negotiating",
  "Closed Won",
];

// Status -> visual indicator color
export const STATUS_COLORS: Record<Status, string> = {
  "Not Started":    "#A1A1AA", // zinc-400
  "Researching":    "#60A5FA", // blue-400
  "Outreach Sent":  "#FBBF24", // amber-400
  "Responded":      "#FB923C", // orange-400
  "Discovery Call": "#6366F1", // indigo-500
  "Pilot Active":   "#06B6D4", // cyan-500
  "Proposal Sent":  "#8B5CF6", // violet-500
  "Negotiating":    "#F59E0B", // amber-500
  "Closed Won":     "#10B981", // emerald-500
  "Closed Lost":    "#EF4444", // red-500
  "Nurture":        "#94A3B8", // slate-400
};

export const TIER_COLORS: Record<Tier, string> = {
  "Tier 1":  "#10B981", // emerald
  "Tier 2":  "#F59E0B", // amber
  "Tier 3":  "#EF4444", // red
  "Channel": "#6366F1", // indigo
};

export const CATEGORIES: Category[] = [
  "APEX Accelerator",
  "VBOC",
  "SBDC",
  "MBDA Center",
  "Veteran Member Association",
  "8(a) Association",
  "HUBZone Association",
  "WOSB Association",
  "Trade Association",
  "Tribal 8(a)",
  "Mentor-Protege JV",
  "Channel Partner",
  "University Federal Office",
  "State Procurement Office",
  "Existing Customer",
];

export const TIERS: Tier[] = ["Tier 1", "Tier 2", "Tier 3", "Channel"];
export const OWNERS: Owner[] = ["Branden", "Eric", "Joint", "TBD"];

// Deal-size bucket midpoints for ARR/pipeline math
export const DEAL_MIDPOINTS: Record<string, number> = {
  "$25K-$35K":  30000,
  "$25K-$50K":  37500,
  "$50K-$68K":  59000,
  "$50K-$75K":  62500,
  "$50K-$100K": 75000,
  "$75K-$100K": 87500,
  "$75K-$150K": 112500,
  "$100K+":     125000,
  "$150K+":     175000,
  "Referral":   0,
  "TBD":        50000,
};

export const DEAL_SIZES = Object.keys(DEAL_MIDPOINTS);

// Statuses that count as "active pipeline" for $ math
export const ACTIVE_PIPELINE_STATUSES: Status[] = [
  "Outreach Sent",
  "Responded",
  "Discovery Call",
  "Pilot Active",
  "Proposal Sent",
  "Negotiating",
];

// ──────────────────────────────────────────────────────────────────────────
// Outreach / email follow-up
// ──────────────────────────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  // 0 = initial cold email; 1+ = follow-up steps in a sequence
  step: number;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  offsetDays: number;   // days after the prior step (or after first send for step 0)
  templateId: string;
}

export interface Sequence {
  id: string;
  name: string;
  steps: SequenceStep[];
  createdAt: string;
  updatedAt: string;
}

export interface SentMessage {
  id: string;
  contactId: string;
  sequenceId?: string;
  templateId?: string;
  step: number;              // 0 = initial, 1+ = follow-up
  subject: string;
  body: string;              // full body as sent
  bodyPreview: string;       // first ~200 chars for list views
  sentAt: string;            // ISO date string
  // Filled in once Gmail integration is wired up — optional for now
  gmailMessageId?: string;
  gmailThreadId?: string;
  rfc822MessageId?: string;
  // Reply tracking (for now, set manually via "Log reply"; later via Gmail sync)
  replied: boolean;
  lastReplyAt?: string;
  lastReplySnippet?: string;
}

// Statuses where sequenced follow-ups should keep firing.
// If a contact lands outside this set, the sequence is considered "stopped".
export const SEQUENCE_ACTIVE_STATUSES: Status[] = [
  "Outreach Sent",
];

// Default starter templates — seeded on first load so the dashboard isn't empty.
export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "tmpl-initial",
    name: "Initial outreach",
    step: 0,
    subject: "MI partnership for {{organization}}",
    body:
      "Hi {{firstName}},\n\n" +
      "{{outreachHook}}\n\n" +
      "I lead enterprise partnerships at Market Assassin — we help organizations like {{organization}} surface federal contracting intel for the small businesses you serve. " +
      "Would you be open to a 20-minute call to compare notes on what your team is seeing?\n\n" +
      "Best,\n{{senderName}}",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "tmpl-bump-1",
    name: "Follow-up 1 — soft bump",
    step: 1,
    subject: "Re: MI partnership for {{organization}}",
    body:
      "Hi {{firstName}},\n\n" +
      "Floating this back to the top of your inbox in case it got buried. Happy to send a short loom instead of a call if that's easier.\n\n" +
      "Best,\n{{senderName}}",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "tmpl-bump-2",
    name: "Follow-up 2 — value-add",
    step: 2,
    subject: "Re: MI partnership for {{organization}}",
    body:
      "Hi {{firstName}},\n\n" +
      "One more nudge — we just published a breakdown of FY26 set-aside trends for the categories your clients work in. Happy to share it directly, no strings.\n\n" +
      "Worth a quick chat?\n\n" +
      "Best,\n{{senderName}}",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "tmpl-breakup",
    name: "Follow-up 3 — breakup",
    step: 3,
    subject: "Re: MI partnership for {{organization}}",
    body:
      "Hi {{firstName}},\n\n" +
      "Looks like the timing isn't right — I'll stop reaching out for now. If anything changes on your end, my door is open.\n\n" +
      "Best,\n{{senderName}}",
    createdAt: "",
    updatedAt: "",
  },
];

export const DEFAULT_SEQUENCES: Sequence[] = [
  {
    id: "seq-default",
    name: "Default 4-touch (0 / +3 / +7 / +14)",
    steps: [
      { offsetDays: 0,  templateId: "tmpl-initial" },
      { offsetDays: 3,  templateId: "tmpl-bump-1" },
      { offsetDays: 4,  templateId: "tmpl-bump-2"  }, // +7 from start
      { offsetDays: 7,  templateId: "tmpl-breakup" }, // +14 from start
    ],
    createdAt: "",
    updatedAt: "",
  },
];

// Available merge fields, used by the template editor's "Insert field" menu.
export const MERGE_FIELDS = [
  "firstName",
  "lastName",
  "contactName",
  "organization",
  "subOrg",
  "title",
  "outreachHook",
  "senderName",
] as const;
export type MergeField = (typeof MERGE_FIELDS)[number];
