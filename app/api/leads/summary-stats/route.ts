import { LeadStatus } from "@prisma/client";
import { dbErrorResponse } from "../../../../lib/dbErrorResponse";
import { jsonNoStore } from "../../../../lib/jsonNoStore";
import { prismaWhereFromLeadListQuery } from "../../../../lib/leadsListWhere";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

/** Dashboard strip: pool size, enrichment gaps, dead count. */
export async function GET() {
  try {
    const todayWhere = prismaWhereFromLeadListQuery({
      tab: "today",
      search: "",
      stages: [],
      tiers: [],
      lastContact: "any",
      page: 1,
      pageSize: 1
    });

    const [todayEligible, highTierMissingContact, dead] = await prisma.$transaction([
      prisma.lead.count({ where: todayWhere }),
      prisma.lead.count({
        where: {
          tier: { lte: 2 },
          OR: [
            { email: null },
            { email: "" },
            { phone: null },
            { phone: "" }
          ]
        }
      }),
      prisma.lead.count({ where: { status: LeadStatus.dead } })
    ]);

    return jsonNoStore({ todayEligible, highTierMissingContact, dead });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
