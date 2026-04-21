export type LeadStatus =
  | "active"
  | "no_reply"
  | "replied"
  | "booked_call"
  | "no_further_follow_up"
  | "dead";

export type Method = "email" | "call";
export type Outcome = "no_reply" | "replied" | "booked_call";
/** Touch log reply / outcome (matches Prisma TouchOutcome after migration). */
export type LeadTouchOutcome = "no_reply" | "replied" | "booked_call" | "not_interested";

export type LogTouchPayload = {
  leadId: number;
  type: Method;
  outcome: LeadTouchOutcome;
  notes: string;
  /** When set, sent as `script_id` so the logged touch matches the chosen script. */
  scriptId?: number;
};

export type TouchpointRow = {
  id: number;
  type: Method;
  outcome: string;
  date: string;
  notes?: string;
  scriptId: number | null;
  scriptName?: string;
};

export type Lead = {
  id: number;
  companyName: string;
  website?: string;
  location?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  tier: 1 | 2 | 3 | 4 | 5;
  lastContactDate?: string;
  status: LeadStatus;
  nextAction: "cold_email" | "cold_call" | "follow_up" | "none";
  nextActionDate?: string;
  preferredContactMethod: Method;
  touchCount: number;
  noFurtherFollowUp?: boolean;
  /** Latest touch outcome (from list API join), for reply-type column. */
  lastTouchOutcome?: string | null;
};

/** Paginated `GET /api/leads` response. */
export type LeadsListApiResponse = {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
};

export type AIRecommendedAction = {
  leadId: number;
  companyName: string;
  tier: Lead["tier"];
  contactMethod: Method;
  scriptId: number;
  scriptName: string;
  reason: string[];
};

export type AIEnrichCandidate = {
  leadId: number;
  companyName: string;
  tier: Lead["tier"];
  missing: Array<"email" | "phone">;
};

export type Script = {
  id: number;
  name: string;
  stage: "cold_email" | "cold_call" | "follow_up";
  tier: 1 | 2 | 3 | 4 | 5;
  content: string;
  active: boolean;
  totalSends: number;
  replies: number;
  bookedCalls: number;
  performanceScore: number;
};

export type TodoItem = {
  id: string;
  leadId: number;
  leadName: string;
  tier: 1 | 2 | 3 | 4 | 5;
  method: Method;
  scriptId: number;
  scriptName: string;
  overdue: boolean;
  status: "pending" | "done";
  /** Present when returned from today-todo (for client filtering / badges). */
  leadStatus?: LeadStatus;
};
