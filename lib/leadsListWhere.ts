import { LeadStatus, type Prisma } from "@prisma/client";
import type { LeadsListQueryState } from "./leadsListParams";

function startOfUtcDay(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function utcDaysAgo(n: number) {
  const x = startOfUtcDay();
  x.setUTCDate(x.getUTCDate() - n);
  return x;
}

/** Maps dashboard stage chips to Prisma `OR` branches (any selected stage matches). */
function stagesToOrBranches(stages: LeadsListQueryState["stages"]): Prisma.LeadWhereInput[] {
  const ors: Prisma.LeadWhereInput[] = [];
  for (const s of stages) {
    if (s === "new") {
      ors.push({ status: LeadStatus.active, totalTouches: 0, lastContactDate: null });
    } else if (s === "contacted") {
      ors.push({ status: LeadStatus.no_reply });
    } else if (s === "replied") {
      ors.push({ status: LeadStatus.replied });
    } else if (s === "booked") {
      ors.push({ status: LeadStatus.booked_call });
    } else if (s === "dead") {
      ors.push({ status: LeadStatus.dead });
    }
  }
  return ors;
}

export function prismaWhereFromLeadListQuery(q: LeadsListQueryState): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];

  if (q.tab === "today") {
    and.push({
      status: { notIn: [LeadStatus.dead, LeadStatus.booked_call, LeadStatus.no_further_follow_up] },
      totalTouches: { lt: 3 }
    });
  }

  const term = q.search.trim();
  if (term.length > 0) {
    and.push({
      OR: [
        { companyName: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
        { ownerName: { contains: term, mode: "insensitive" } }
      ]
    });
  }

  if (q.stages.length > 0) {
    const branches = stagesToOrBranches(q.stages);
    if (branches.length > 0) and.push({ OR: branches });
  }

  if (q.tiers.length > 0) {
    and.push({ tier: { in: q.tiers } });
  }

  if (q.lastContact === "none") {
    and.push({ lastContactDate: null });
  } else if (q.lastContact === "over7") {
    const cutoff = utcDaysAgo(7);
    and.push({ lastContactDate: { lt: cutoff } });
  } else if (q.lastContact === "within7") {
    const cutoff = utcDaysAgo(7);
    and.push({ lastContactDate: { gte: cutoff } });
  }

  return and.length > 0 ? { AND: and } : {};
}
