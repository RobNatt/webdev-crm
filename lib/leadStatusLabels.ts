import type { Lead } from "./types";

/** Human-readable status for the lead table (pipeline language). */
export function formatLeadRowStatus(lead: Lead): string {
  if (lead.status === "dead") return "Dead";
  if (lead.status === "no_further_follow_up") return "Closed";
  if (lead.status === "booked_call") return "Booked";
  if (lead.status === "replied") return "Replied";
  if (lead.status === "no_reply") return "Contacted";
  if (lead.status === "active" && lead.touchCount === 0) return "New";
  return "Active";
}

export function formatTouchOutcomeLabel(outcome: string | undefined | null): string {
  if (!outcome) return "—";
  if (outcome === "no_reply") return "No reply";
  if (outcome === "replied") return "Replied";
  if (outcome === "booked_call") return "Booked call";
  if (outcome === "not_interested") return "Not interested";
  return outcome;
}
