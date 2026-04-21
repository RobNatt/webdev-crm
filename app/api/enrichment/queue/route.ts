import { TaskStatus, TaskType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const leadIds = Array.isArray(body.leadIds) ? body.leadIds.map(Number).filter((n: number) => Number.isFinite(n)) : [];
  const queued: number[] = [];

  for (const leadId of leadIds) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.tier < 4) continue;

    const missingEmail = !lead.email?.trim();
    const missingPhone = !lead.phone?.trim();
    if (!missingEmail && !missingPhone) continue;

    const existing = await prisma.task.findFirst({
      where: {
        leadId,
        type: TaskType.Enrichment,
        status: TaskStatus.Pending
      }
    });
    if (existing) continue;

    await prisma.task.create({
      data: {
        leadId,
        type: TaskType.Enrichment,
        status: TaskStatus.Pending,
        aiGenerated: true,
        aiInstructions: "Find email/phone via site scrape or external API."
      }
    });
    await prisma.lead.update({
      where: { id: leadId },
      data: { enrichmentAttempts: { increment: 1 } }
    });
    queued.push(leadId);
  }

  return NextResponse.json({
    success: true,
    queuedCount: queued.length,
    leadIds: queued
  });
}
