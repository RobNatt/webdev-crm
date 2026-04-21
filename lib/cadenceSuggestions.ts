import type { Lead as PrismaLead, Script as PrismaScript } from "@prisma/client";
import { scriptToApi } from "./mappers";
import type { Lead, Method, Script, TouchpointRow } from "./types";
import { pickScriptForLead } from "./touchpointApi";

function asPrismaLead(lead: Lead): PrismaLead {
  return { tier: lead.tier, nextAction: lead.nextAction } as PrismaLead;
}

function asPrismaScripts(scripts: Script[]): PrismaScript[] {
  return scripts as unknown as PrismaScript[];
}

/** Suggested channel for the next touch (matches cadence: email → then call reference, etc.). */
export function suggestNextMethod(lead: Lead, touchpointsNewestFirst: TouchpointRow[]): Method {
  if (lead.nextAction === "cold_email") return "email";
  if (lead.nextAction === "cold_call") return "call";
  if (lead.nextAction === "none") return lead.preferredContactMethod;
  const last = touchpointsNewestFirst[0];
  if (last?.type === "email") return "call";
  if (last?.type === "call") return "email";
  return lead.touchCount === 0 ? lead.preferredContactMethod : "call";
}

export type CadenceSuggestion = {
  headline: string;
  detail: string;
  method: Method;
  script: Script | undefined;
};

/** Sales-style guidance for the next outreach step (copy + script + method). */
export function getCadenceSuggestion(lead: Lead, touchpointsNewestFirst: TouchpointRow[], scripts: Script[]): CadenceSuggestion {
  const method = suggestNextMethod(lead, touchpointsNewestFirst);
  const picked = pickScriptForLead(asPrismaLead(lead), asPrismaScripts(scripts));
  const script: Script | undefined = picked ? scriptToApi(picked) : undefined;
  const n = lead.touchCount;
  const last = touchpointsNewestFirst[0];

  if (lead.nextAction === "none") {
    return {
      headline: "No further automated touch",
      detail: "This lead is closed for cadence outreach. You can still add notes from the timeline if your product allows it.",
      method,
      script: undefined
    };
  }

  if (n === 0 && lead.nextAction === "cold_email") {
    return {
      headline: "Touch 1 — cold email",
      detail: "First contact: send your tier-matched cold email. Personalize the opener with their company or site.",
      method: "email",
      script
    };
  }

  if (n === 0 && lead.nextAction === "cold_call") {
    return {
      headline: "Touch 1 — cold call",
      detail: "Open with your cold-call script. Confirm you have the right decision-maker before pitching.",
      method: "call",
      script
    };
  }

  if (lead.nextAction === "follow_up" && last?.type === "email") {
    return {
      headline: "Day 2–3 — call, referencing your email",
      detail:
        "They received your email; a short call that references the subject line or one bullet builds continuity. Use your follow-up script for this tier.",
      method: "call",
      script
    };
  }

  if (lead.nextAction === "follow_up" && last?.type === "call") {
    return {
      headline: "Follow-up — email after your call",
      detail: "Send a concise recap email: what you heard, one value point, and a clear next step. Use your follow-up email script.",
      method: "email",
      script
    };
  }

  if (lead.nextAction === "follow_up") {
    return {
      headline: `Touch ${n + 1} — follow-up`,
      detail: "Stay on cadence with your follow-up script. Alternate email and call so you are easy to work with, not pushy.",
      method,
      script
    };
  }

  return {
    headline: "Next outreach",
    detail: "Log the touch you completed so stats and next steps stay accurate.",
    method,
    script
  };
}
