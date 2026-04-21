import { LeadNextAction, LeadStatus } from "@prisma/client";
import { prisma } from "./prisma";

/** Soft-close: keep row, stop follow-up (matches product “mark dead”). */
export async function applyMarkLeadDead(leadId: number) {
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      status: LeadStatus.dead,
      nextAction: LeadNextAction.none,
      noFurtherFollowUp: true
    }
  });
}

/** Re-open outreach; does not change Touchpoint rows. */
export async function applyUnmarkLeadDead(leadId: number) {
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      status: LeadStatus.active,
      noFurtherFollowUp: false,
      nextAction: LeadNextAction.follow_up
    }
  });
}
