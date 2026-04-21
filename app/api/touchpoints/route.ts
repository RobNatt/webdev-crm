import { LeadStatus, TouchOutcome, TouchpointType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { leadToApi } from "../../../lib/mappers";
import { prisma } from "../../../lib/prisma";
import { recomputeScriptStats } from "../../../lib/scriptStats";

function mapOutcome(raw: string | undefined): TouchOutcome {
  if (raw === "replied") return TouchOutcome.replied;
  if (raw === "booked_call") return TouchOutcome.booked_call;
  return TouchOutcome.no_reply;
}

function mapLeadStatus(outcome: TouchOutcome): LeadStatus {
  if (outcome === TouchOutcome.replied) return LeadStatus.replied;
  if (outcome === TouchOutcome.booked_call) return LeadStatus.booked_call;
  return LeadStatus.no_reply;
}

function mapTouchType(raw: string | undefined): TouchpointType {
  if (raw === "call") return TouchpointType.call;
  return TouchpointType.email;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const leadId = Number(body.lead_id);
  const scriptId = Number(body.script_id);
  const outcome = mapOutcome(body.outcome);
  const touchType = mapTouchType(body.type);

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  if (lead.totalTouches >= 3 || lead.status === LeadStatus.dead || lead.status === LeadStatus.no_further_follow_up) {
    return NextResponse.json({ error: "Lead is closed for outreach" }, { status: 400 });
  }

  const script = await prisma.script.findUnique({ where: { id: scriptId } });
  if (!script) return NextResponse.json({ error: "Script not found" }, { status: 404 });

  const nextTouches = lead.totalTouches + 1;
  let status: LeadStatus = mapLeadStatus(outcome);
  if (nextTouches >= 3) status = LeadStatus.no_further_follow_up;

  const updatedLead = await prisma.$transaction(async (tx) => {
    await tx.touchpoint.create({
      data: {
        leadId,
        scriptId,
        type: touchType,
        outcome,
        notes: typeof body.notes === "string" ? body.notes : null
      }
    });
    return tx.lead.update({
      where: { id: leadId },
      data: {
        totalTouches: nextTouches,
        lastContactDate: new Date(),
        status
      }
    });
  });

  await recomputeScriptStats(scriptId);

  const refreshedScript = await prisma.script.findUnique({ where: { id: scriptId } });

  return NextResponse.json({
    success: true,
    lead: leadToApi(updatedLead),
    scriptPerformance: refreshedScript
      ? {
          scriptId: refreshedScript.id,
          totalSends: refreshedScript.totalSends,
          replies: refreshedScript.replies,
          bookedCalls: refreshedScript.bookedCalls,
          performanceScore: refreshedScript.performanceScore
        }
      : undefined
  });
}
