import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getEffectiveCap, getMaxDailyOutreach, startOfUtcDay } from "../../../../lib/todayTodo";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const leadIds = Array.isArray(body.leadIds) ? body.leadIds.map(Number).filter((n: number) => Number.isFinite(n)) : [];
  const settingsCap = await getMaxDailyOutreach();
  const cap = getEffectiveCap(undefined, settingsCap);
  const accepted = leadIds.slice(0, cap);
  const day = startOfUtcDay();

  if (accepted.length > 0) {
    await prisma.$transaction(
      accepted.map((leadId: number) =>
        prisma.dailyAppliedLead.upsert({
          where: {
            leadId_appliedOn: {
              leadId,
              appliedOn: day
            }
          },
          create: { leadId, appliedOn: day },
          update: {}
        })
      )
    );
  }

  return NextResponse.json({
    success: true,
    appliedCount: accepted.length,
    effectiveCap: cap
  });
}
