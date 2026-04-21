import { ContactMethod, LeadNextAction, LeadStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { leadIdentityKey } from "../../../lib/leadIdentity";
import { leadToApi } from "../../../lib/mappers";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const rows = await prisma.lead.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ leads: rows.map(leadToApi) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const rows = Array.isArray(body.leads) ? body.leads : [];

  const existing = await prisma.lead.findMany({
    select: { companyName: true, website: true, phone: true }
  });
  const existingKeys = new Set(
    existing.map((l) => leadIdentityKey({ companyName: l.companyName, website: l.website ?? undefined, phone: l.phone ?? undefined }))
  );
  existing.forEach((l) => existingKeys.add(leadIdentityKey({ companyName: l.companyName })));

  let skippedDuplicates = 0;
  const createdApi: ReturnType<typeof leadToApi>[] = [];

  for (const row of rows as Record<string, string>[]) {
    const companyName = row.company_name?.trim() || row.companyName?.trim();
    const key = leadIdentityKey({ companyName, website: row.website, phone: row.phone });
    if (existingKeys.has(key) || existingKeys.has(leadIdentityKey({ companyName }))) {
      skippedDuplicates += 1;
      continue;
    }
    const hasWebsite = Boolean((row.website ?? "").trim());
    const lead = await prisma.lead.create({
      data: {
        companyName: companyName || "Imported lead",
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
    existingKeys.add(leadIdentityKey({ companyName: lead.companyName }));
    createdApi.push(leadToApi(lead));
  }

  return NextResponse.json(
    { createdCount: createdApi.length, skippedDuplicates, leads: createdApi },
    { status: 201 }
  );
}
