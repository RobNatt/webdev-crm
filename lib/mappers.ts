import type { Lead as PrismaLead, Script as PrismaScript } from "@prisma/client";
import type { Lead, Script } from "./types";

export function toDateString(d: Date | null | undefined): string | undefined {
  if (!d) return undefined;
  return d.toISOString().slice(0, 10);
}

export function leadToApi(lead: PrismaLead): Lead {
  return {
    id: lead.id,
    companyName: lead.companyName,
    website: lead.website ?? undefined,
    location: lead.location ?? undefined,
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    ownerName: lead.ownerName ?? undefined,
    tier: lead.tier as Lead["tier"],
    lastContactDate: toDateString(lead.lastContactDate),
    status: lead.status as Lead["status"],
    nextAction: lead.nextAction as Lead["nextAction"],
    nextActionDate: toDateString(lead.nextActionDate),
    preferredContactMethod: lead.preferredContactMethod as Lead["preferredContactMethod"],
    touchCount: lead.totalTouches
  };
}

export function scriptToApi(script: PrismaScript): Script {
  return {
    id: script.id,
    name: script.name,
    stage: script.type as Script["stage"],
    tier: script.tier as Script["tier"],
    content: script.content,
    active: script.active,
    totalSends: script.totalSends,
    replies: script.replies,
    bookedCalls: script.bookedCalls,
    performanceScore: script.performanceScore
  };
}
