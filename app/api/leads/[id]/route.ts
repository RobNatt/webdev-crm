import { NextRequest } from "next/server";
import { applyMarkLeadDead } from "../../../../lib/leadLifecycle";
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
      const updated = await applyMarkLeadDead(leadId);
      return jsonNoStore({ lead: leadToApi(updated) });
    }

    return jsonNoStore(
      { error: "Unsupported action", hint: "Use PATCH /api/leads/{id}/status with mark_dead or unmark_dead" },
      { status: 400 }
    );
  } catch (e) {
    return dbErrorResponse(e);
  }
}
