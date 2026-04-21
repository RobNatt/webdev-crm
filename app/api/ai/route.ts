import { TaskStatus, TaskType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { dbErrorResponse } from "../../../lib/dbErrorResponse";
import { prisma } from "../../../lib/prisma";
import { generateTodayTodo, getEffectiveCap, getMaxDailyOutreach } from "../../../lib/todayTodo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const userMessage = String(messages[messages.length - 1]?.content ?? "").trim();
  const command = userMessage.startsWith("/") ? userMessage.split(/\s+/)[0] : "";

  const settingsCap = await getMaxDailyOutreach();
  const effectiveCap = getEffectiveCap(undefined, settingsCap);
  const recommended = await generateTodayTodo(undefined);

  const topScripts = await prisma.script.findMany({
    where: { active: true },
    orderBy: { performanceScore: "desc" },
    take: 5
  });

  const leadsHighTier = await prisma.lead.findMany({
    where: { tier: { gte: 4 } }
  });

  const pendingEnrichment = await prisma.task.findMany({
    where: { type: TaskType.Enrichment, status: TaskStatus.Pending },
    select: { leadId: true }
  });
  const pendingSet = new Set(pendingEnrichment.map((t) => t.leadId));

  const enrichCandidates = leadsHighTier
    .filter((lead) => !lead.email?.trim() || !lead.phone?.trim())
    .map((lead) => ({
      leadId: lead.id,
      companyName: lead.companyName,
      tier: lead.tier,
      missing: [!lead.email?.trim() ? "email" : null, !lead.phone?.trim() ? "phone" : null].filter(Boolean) as ("email" | "phone")[],
      queued: pendingSet.has(lead.id)
    }));

  const payload = {
    type: "assistant_response",
    command: command || null,
    text: "Here is your AI recommendation set. Use actions below to apply.",
    today_outreach_count: {
      maxDailyOutreach: effectiveCap,
      recommended: recommended.length
    },
    recommended_actions: recommended.map((item) => ({
      leadId: item.leadId,
      companyName: item.leadName,
      tier: item.tier,
      contactMethod: item.method,
      scriptId: item.scriptId,
      scriptName: item.scriptName,
      reason: ["tier-priority", "within-3-touch-cadence", "script-performance-ranked"]
    })),
    script_recommendations: topScripts.map((script) => ({
      scriptId: script.id,
      name: script.name,
      stage: script.type,
      tier: script.tier,
      performanceScore: script.performanceScore
    })),
    enrich_candidates: enrichCandidates
  };

  if (command === "/scripts") {
    return NextResponse.json({
      ...payload,
      recommended_actions: [],
      enrich_candidates: []
    });
  }

  if (command === "/enrich") {
    return NextResponse.json({
      ...payload,
      recommended_actions: [],
      script_recommendations: []
    });
  }

  if (command === "/today") {
    return NextResponse.json({
      ...payload,
      script_recommendations: []
    });
  }

    return NextResponse.json(payload);
  } catch (e) {
    return dbErrorResponse(e);
  }
}
