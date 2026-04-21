import { LeadNextAction, LeadStatus, ScriptType, type Lead as PrismaLead } from "@prisma/client";
import { leadIdentityKey } from "./leadIdentity";
import { prisma } from "./prisma";
import type { TodoItem } from "./types";

export function getEffectiveCap(requestedLimit: number | undefined, settingsCap: number) {
  const cap = Math.min(30, Math.max(20, settingsCap));
  if (typeof requestedLimit !== "number") return cap;
  return Math.min(cap, Math.min(30, Math.max(20, requestedLimit)));
}

export async function getMaxDailyOutreach() {
  const row = await prisma.userSettings.upsert({
    where: { id: "default" },
    create: { id: "default", maxDailyOutreach: 30 },
    update: {}
  });
  return Math.min(30, Math.max(20, row.maxDailyOutreach));
}

export function startOfUtcDay(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export type GenerateTodayTodoOptions = {
  /** When true, dead leads can appear in the list (still capped); default hides them. */
  includeDead?: boolean;
};

export async function generateTodayTodo(
  requestedLimit?: number,
  options?: GenerateTodayTodoOptions
): Promise<TodoItem[]> {
  const maxDaily = await getMaxDailyOutreach();
  const effectiveCap = getEffectiveCap(requestedLimit, maxDaily);

  const appliedRows = await prisma.dailyAppliedLead.findMany({
    where: { appliedOn: startOfUtcDay() },
    select: { leadId: true }
  });
  const appliedTodayLeadIds = new Set(appliedRows.map((r) => r.leadId));

  const closed: LeadStatus[] = options?.includeDead
    ? [LeadStatus.booked_call, LeadStatus.no_further_follow_up]
    : [LeadStatus.dead, LeadStatus.booked_call, LeadStatus.no_further_follow_up];

  const allLeads = await prisma.lead.findMany({
    where: {
      status: { notIn: closed },
      totalTouches: { lt: 3 }
    }
  });

  const scripts = await prisma.script.findMany({ where: { active: true } });

  const seenLeadKeys = new Set<string>();
  type Row = { lead: PrismaLead; selectedScript: (typeof scripts)[number]; overdue: boolean };
  const eligible: Row[] = [];

  const todayStr = new Date().toISOString().slice(0, 10);

  for (const lead of allLeads) {
    const key = leadIdentityKey({ companyName: lead.companyName });
    if (seenLeadKeys.has(key)) continue;
    seenLeadKeys.add(key);

    const matching = scripts
      .filter((s) => s.active && s.tier === lead.tier)
      .filter((s) => {
        if (lead.nextAction === LeadNextAction.none) return false;
        if (lead.nextAction === LeadNextAction.follow_up) return s.type === ScriptType.follow_up;
        return s.type === lead.nextAction;
      })
      .sort((a, b) => b.performanceScore - a.performanceScore);

    let selectedScript = matching[0];
    if (
      !selectedScript &&
      options?.includeDead &&
      lead.status === LeadStatus.dead
    ) {
      selectedScript = scripts
        .filter((s) => s.active && s.tier === lead.tier)
        .sort((a, b) => b.performanceScore - a.performanceScore)[0];
    }
    if (!selectedScript) continue;

    const nd = lead.nextActionDate ? lead.nextActionDate.toISOString().slice(0, 10) : null;
    const overdue = Boolean(nd && nd < todayStr);
    eligible.push({ lead, selectedScript, overdue });
  }

  eligible.sort((a, b) => {
    if (a.lead.tier !== b.lead.tier) return a.lead.tier - b.lead.tier;
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return b.selectedScript.performanceScore - a.selectedScript.performanceScore;
  });

  const capped = eligible.slice(0, effectiveCap);
  capped.sort((a, b) => {
    const aApplied = appliedTodayLeadIds.has(a.lead.id);
    const bApplied = appliedTodayLeadIds.has(b.lead.id);
    if (aApplied !== bApplied) return aApplied ? -1 : 1;
    return 0;
  });

  return capped.map((item, index) => ({
    id: `todo-${index + 1}`,
    leadId: item.lead.id,
    leadName: item.lead.companyName,
    tier: item.lead.tier as TodoItem["tier"],
    method: item.lead.preferredContactMethod as TodoItem["method"],
    scriptId: item.selectedScript.id,
    scriptName: item.selectedScript.name,
    overdue: item.overdue,
    status: "pending" as const,
    leadStatus: item.lead.status as TodoItem["leadStatus"]
  }));
}
