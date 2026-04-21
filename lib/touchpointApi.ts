import { LeadNextAction, ScriptType } from "@prisma/client";
import type { Lead as PrismaLead, Script } from "@prisma/client";

/** Pick best active script for logging a touch (same rules as today’s to-do). */
export function pickScriptForLead(lead: PrismaLead, scripts: Script[]): Script | undefined {
  const matching = scripts
    .filter((s) => s.active && s.tier === lead.tier)
    .filter((s) => {
      if (lead.nextAction === LeadNextAction.none) return false;
      if (lead.nextAction === LeadNextAction.follow_up) return s.type === ScriptType.follow_up;
      return s.type === lead.nextAction;
    })
    .sort((a, b) => b.performanceScore - a.performanceScore);
  return matching[0];
}
