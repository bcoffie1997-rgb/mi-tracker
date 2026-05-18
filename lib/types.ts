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
  "Not Started":    "#9BA3AE",
  "Researching":    "#5C7BA8",
  "Outreach Sent":  "#C9A75A",
  "Responded":      "#D88A5B",
  "Discovery Call": "#3A5F8A",
  "Pilot Active":   "#5C7355",
  "Proposal Sent":  "#1F3A5F",
  "Negotiating":    "#9C7A2E",
  "Closed Won":     "#3D7A4B",
  "Closed Lost":    "#A0392E",
  "Nurture":        "#7B8FA8",
};

export const TIER_COLORS: Record<Tier, string> = {
  "Tier 1":  "#3D7A4B",
  "Tier 2":  "#9C7A2E",
  "Tier 3":  "#A0522D",
  "Channel": "#3A5F8A",
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
