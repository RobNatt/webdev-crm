import { LeadNextAction, LeadStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { leadToApi } from "../../../../lib/mappers";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const leadId = Number(params.id);
  if (!Number.isFinite(leadId)) {
    return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const body = await request.json();
  if (body.action === "mark_dead") {
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { status: LeadStatus.dead, nextAction: LeadNextAction.none }
    });
    return NextResponse.json({ lead: leadToApi(updated) });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
