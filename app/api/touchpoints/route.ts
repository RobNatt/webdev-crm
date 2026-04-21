import {
  LeadNextAction,
  LeadStatus,
  TouchOutcome,
  TouchpointType
} from "@prisma/client";
import { NextRequest } from "next/server";
import { dbErrorResponse } from "../../../lib/dbErrorResponse";
import { jsonNoStore } from "../../../lib/jsonNoStore";
import { leadToApi, touchpointToApi } from "../../../lib/mappers";
import { prisma } from "../../../lib/prisma";
import { recomputeScriptStats } from "../../../lib/scriptStats";
import { pickScriptForLead } from "../../../lib/touchpointApi";

export const dynamic = "force-dynamic";

function mapOutcome(raw: string | undefined): TouchOutcome {
  if (raw === "replied") return TouchOutcome.replied;
  if (raw === "booked_call") return TouchOutcome.booked_call;
  if (raw === "not_interested") return TouchOutcome.not_interested;
  return TouchOutcome.no_reply;
}

function mapLeadStatus(outcome: TouchOutcome): LeadStatus {
  if (outcome === TouchOutcome.replied) return LeadStatus.replied;
  if (outcome === TouchOutcome.booked_call) return LeadStatus.booked_call;
  if (outcome === TouchOutcome.not_interested) return LeadStatus.no_further_follow_up;
  return LeadStatus.no_reply;
}

function mapTouchType(raw: string | undefined): TouchpointType {
  if (raw === "call") return TouchpointType.call;
  return TouchpointType.email;
}

/** List touchpoints for a lead (newest first). */
export async function GET(request: NextRequest) {
  try {
    const leadId = Number(request.nextUrl.searchParams.get("leadId"));
    if (!Number.isFinite(leadId)) {
      return jsonNoStore({ error: "leadId query parameter required" }, { status: 400 });
    }
    const rows = await prisma.touchpoint.findMany({
      where: { leadId },
      orderBy: { date: "desc" },
      include: { script: { select: { id: true, name: true } } }
    });
    return jsonNoStore({ touchpoints: rows.map((t) => touchpointToApi(t)) });
  } catch (e) {
    return dbErrorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
    }

    const leadId = Number(body.lead_id);
    if (!Number.isFinite(leadId)) {
      return jsonNoStore({ error: "lead_id is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return jsonNoStore({ error: "Lead not found" }, { status: 404 });

    if (
      lead.totalTouches >= 3 ||
      lead.status === LeadStatus.dead ||
      lead.status === LeadStatus.no_further_follow_up
    ) {
      return jsonNoStore({ error: "Lead is closed for outreach" }, { status: 400 });
    }

    const scripts = await prisma.script.findMany({ where: { active: true } });
    let scriptId = Number(body.script_id);
    if (!Number.isFinite(scriptId)) {
      const picked = pickScriptForLead(lead, scripts);
      if (!picked) {
        return jsonNoStore(
          { error: "No active script found for this lead’s tier and next action" },
          { status: 400 }
        );
      }
      scriptId = picked.id;
    }

    const script = await prisma.script.findUnique({ where: { id: scriptId } });
    if (!script) return jsonNoStore({ error: "Script not found" }, { status: 404 });

    const outcome = mapOutcome(typeof body.outcome === "string" ? body.outcome : undefined);
    const touchType = mapTouchType(typeof body.type === "string" ? body.type : undefined);
    const notes =
      typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 8000) : null;

    const nextTouches = lead.totalTouches + 1;
    let status: LeadStatus = mapLeadStatus(outcome);
    if (nextTouches >= 3) status = LeadStatus.no_further_follow_up;

    const created = await prisma.$transaction(async (tx) => {
      const tp = await tx.touchpoint.create({
        data: {
          leadId,
          scriptId,
          type: touchType,
          outcome,
          notes
        },
        include: { script: { select: { id: true, name: true } } }
      });
      const updatedLead = await tx.lead.update({
        where: { id: leadId },
        data: {
          totalTouches: nextTouches,
          lastContactDate: new Date(),
          status,
          ...(outcome === TouchOutcome.not_interested ? { nextAction: LeadNextAction.none } : {})
        }
      });
      return { tp, updatedLead };
    });

    await recomputeScriptStats(scriptId);

    const refreshedScript = await prisma.script.findUnique({ where: { id: scriptId } });

    return jsonNoStore({
      success: true,
      touchpoint: touchpointToApi(created.tp),
      lead: leadToApi(created.updatedLead),
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
  } catch (e) {
    return dbErrorResponse(e);
  }
}
