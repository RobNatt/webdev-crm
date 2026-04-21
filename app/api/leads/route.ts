import { ContactMethod, LeadNextAction, LeadStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { dbErrorResponse } from "../../../lib/dbErrorResponse";
import { leadIdentityKey } from "../../../lib/leadIdentity";
import { jsonNoStore } from "../../../lib/jsonNoStore";
import { leadToApi } from "../../../lib/mappers";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.lead.findMany({ orderBy: { id: "asc" } });
    return jsonNoStore({ leads: rows.map(leadToApi) });
  } catch (e) {
    return dbErrorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rows = Array.isArray((body as { leads?: unknown }).leads) ? (body as { leads: Record<string, string>[] }).leads : [];

  try {
    const existing = await prisma.lead.findMany({
      select: { companyName: true, website: true, phone: true }
    });
    /** Full identity: company + normalized website + phone digits. No separate "company-only" match — that incorrectly treated different locations with the same name as duplicates. */
    const existingKeys = new Set(
      existing.map((l) =>
        leadIdentityKey({ companyName: l.companyName, website: l.website ?? undefined, phone: l.phone ?? undefined })
      )
    );

    let skippedDuplicates = 0;
    let skippedEmpty = 0;
    const createdApi: ReturnType<typeof leadToApi>[] = [];

    for (const row of rows) {
      const companyName = (row.company_name?.trim() || row.companyName?.trim() || "").trim();
      if (!companyName) {
        skippedEmpty += 1;
        continue;
      }
      const key = leadIdentityKey({ companyName, website: row.website, phone: row.phone });
      if (existingKeys.has(key)) {
        skippedDuplicates += 1;
        continue;
      }
      const hasWebsite = Boolean((row.website ?? "").trim());
      const lead = await prisma.lead.create({
        data: {
          companyName,
          website: (row.website ?? "").trim() || null,
          location: (row.location ?? "").trim() || null,
          phone: (row.phone ?? "").trim() || null,
          email: (row.email ?? "").trim() || null,
          ownerName: (row.owner_name ?? row.ownerName ?? "").trim() || null,
          tier: hasWebsite ? 3 : 5,
          status: LeadStatus.active,
          nextAction: LeadNextAction.cold_email,
          preferredContactMethod: row.phone?.trim() ? ContactMethod.call : ContactMethod.email,
          nextActionDate: new Date(new Date().toISOString().slice(0, 10)),
          totalTouches: 0
        }
      });
      existingKeys.add(key);
      createdApi.push(leadToApi(lead));
    }

    return jsonNoStore(
      { createdCount: createdApi.length, skippedDuplicates, skippedEmpty, leads: createdApi },
      { status: 201 }
    );
  } catch (e) {
    return dbErrorResponse(e);
  }
}
