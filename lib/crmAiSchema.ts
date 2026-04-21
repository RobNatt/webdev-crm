import { z } from "zod";

/** One outreach slot the UI can apply to DailyAppliedLead + show in to-do. */
export const recommendedLeadSchema = z.object({
  leadId: z.number().int(),
  companyName: z.string(),
  tier: z.number().int().min(1).max(5),
  contactMethod: z.enum(["email", "call"]),
  scriptId: z.number().int(),
  scriptName: z.string(),
  rationale: z.string().optional()
});

export const crmAssistantResultSchema = z.object({
  version: z.literal(1),
  /** Short natural-language summary for the chat transcript. */
  summary: z.string(),
  /** Prioritized outreach list; max length must respect daily cap (20–30) in logic. */
  recommendedLeads: z.array(recommendedLeadSchema).max(30),
  /** Optional: which scripts you are leaning on and why. */
  scriptsToUse: z
    .array(
      z.object({
        scriptId: z.number().int(),
        name: z.string(),
        reason: z.string().optional()
      })
    )
    .optional(),
  /** High-tier leads missing contact info → queue Enrichment tasks. */
  enrichCandidates: z
    .array(
      z.object({
        leadId: z.number().int(),
        companyName: z.string(),
        tier: z.number().int(),
        missing: z.array(z.enum(["email", "phone"]))
      })
    )
    .optional(),
  /** Optional: re-tier scraped leads (1 = best, 5 = weakest / no site). */
  tierAssignments: z
    .array(
      z.object({
        leadId: z.number().int(),
        newTier: z.number().int().min(1).max(5),
        rationale: z.string()
      })
    )
    .optional()
});

export type CrmAssistantResult = z.infer<typeof crmAssistantResultSchema>;

export type AiChatRequestBody = {
  command: string | null;
  message: string;
};
