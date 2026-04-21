import { LeadNextAction, LeadStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { dbErrorResponse } from "../../../../lib/dbErrorResponse";
import { jsonNoStore } from "../../../../lib/jsonNoStore";
import { leadToApi, touchpointToApi } from "../../../../lib/mappers";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const leadId = Number(params.id);
    if (!Number.isFinite(leadId)) {
      return jsonNoStore({ error: "Invalid lead id" }, { status: 400 });
    }
    const row = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        touchpoints: {
          orderBy: { date: "desc" },
          include: { script: { select: { id: true, name: true } } }
        }
      }
    });
    if (!row) return jsonNoStore({ error: "Lead not found" }, { status: 404 });
    return jsonNoStore({
      lead: leadToApi(row),
      touchpoints: row.touchpoints.map((t) => touchpointToApi(t))
    });
  } catch (e) {
    return dbErrorResponse(e);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const leadId = Number(params.id);
    if (!Number.isFinite(leadId)) {
      return jsonNoStore({ error: "Invalid lead id" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return jsonNoStore({ error: "Lead not found" }, { status: 404 });

    const body = await request.json();
    if (body.action === "mark_dead") {
      const updated = await prisma.lead.update({
        where: { id: leadId },
        data: { status: LeadStatus.dead, nextAction: LeadNextAction.none }
      });
      return jsonNoStore({ lead: leadToApi(updated) });
    }

    return jsonNoStore({ error: "Unsupported action" }, { status: 400 });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
