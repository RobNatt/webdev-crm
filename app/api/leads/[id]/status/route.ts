import { NextRequest } from "next/server";
import { applyMarkLeadDead, applyUnmarkLeadDead } from "../../../../../lib/leadLifecycle";
import { dbErrorResponse } from "../../../../../lib/dbErrorResponse";
import { jsonNoStore } from "../../../../../lib/jsonNoStore";
import { leadToApi } from "../../../../../lib/mappers";
import { prisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH body: { "action": "mark_dead" | "unmark_dead" }
 * Safe status updates only (no deletes).
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const leadId = Number(params.id);
    if (!Number.isFinite(leadId)) {
      return jsonNoStore({ error: "Invalid lead id" }, { status: 400 });
    }

    const existing = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existing) return jsonNoStore({ error: "Lead not found" }, { status: 404 });

    let body: { action?: string };
    try {
      body = (await request.json()) as { action?: string };
    } catch {
      return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (body.action === "mark_dead") {
      const updated = await applyMarkLeadDead(leadId);
      return jsonNoStore({ lead: leadToApi(updated) });
    }

    if (body.action === "unmark_dead") {
      if (existing.status !== "dead") {
        return jsonNoStore({ error: "Lead is not marked dead" }, { status: 400 });
      }
      const updated = await applyUnmarkLeadDead(leadId);
      return jsonNoStore({ lead: leadToApi(updated) });
    }

    return jsonNoStore({ error: "Unsupported action", hint: "Use mark_dead or unmark_dead" }, { status: 400 });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
