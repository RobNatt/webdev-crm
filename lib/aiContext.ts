import { TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "./prisma";
import { getMaxDailyOutreach } from "./todayTodo";

/** Serializable snapshot for the LLM (keep bounded). */
export async function loadAiContext() {
  const [maxDailyOutreach, leads, scripts, touchpoints, tasks] = await Promise.all([
    getMaxDailyOutreach(),
    prisma.lead.findMany({
      orderBy: { id: "asc" },
      take: 200
    }),
    prisma.script.findMany({ orderBy: { id: "asc" } }),
    prisma.touchpoint.findMany({
      orderBy: { date: "desc" },
      take: 250,
      select: {
        id: true,
        leadId: true,
        scriptId: true,
        type: true,
        outcome: true,
        date: true
      }
    }),
    prisma.task.findMany({
      where: { status: TaskStatus.Pending },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { lead: { select: { id: true, companyName: true, tier: true } } }
    })
  ]);

  return {
    settings: { maxDailyOutreach },
    rules: {
      maxDailyOutreachClamp: [20, 30] as const,
      maxTouchesPerLead: 3,
      enrichmentTierMin: 4,
      tierScale: "1 = strongest fit, 5 = weakest or missing website"
    },
    leads: leads.map((l) => ({
      id: l.id,
      companyName: l.companyName,
      website: l.website,
      location: l.location,
      email: l.email,
      phone: l.phone,
      ownerName: l.ownerName,
      tier: l.tier,
      status: l.status,
      totalTouches: l.totalTouches,
      enrichmentAttempts: l.enrichmentAttempts,
      lastContactDate: l.lastContactDate?.toISOString() ?? null,
      nextAction: l.nextAction,
      nextActionDate: l.nextActionDate?.toISOString() ?? null,
      preferredContactMethod: l.preferredContactMethod,
      noFurtherFollowUp: l.noFurtherFollowUp
    })),
    scripts: scripts.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      tier: s.tier,
      active: s.active,
      performanceScore: s.performanceScore,
      totalSends: s.totalSends,
      replies: s.replies,
      bookedCalls: s.bookedCalls
    })),
    touchpoints: touchpoints.map((t) => ({
      id: t.id,
      leadId: t.leadId,
      scriptId: t.scriptId,
      type: t.type,
      outcome: t.outcome,
      date: t.date.toISOString()
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      leadId: t.leadId,
      type: t.type,
      status: t.status,
      aiGenerated: t.aiGenerated,
      dueDate: t.dueDate?.toISOString() ?? null
    }))
  };
}
