import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const row = await prisma.userSettings.upsert({
    where: { id: "default" },
    create: { id: "default", maxDailyOutreach: 30 },
    update: {}
  });
  return NextResponse.json({ userSettings: { maxDailyOutreach: row.maxDailyOutreach } });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  let max = 30;
  if (typeof body.maxDailyOutreach === "number") {
    max = Math.min(30, Math.max(20, body.maxDailyOutreach));
  }
  const row = await prisma.userSettings.upsert({
    where: { id: "default" },
    create: { id: "default", maxDailyOutreach: max },
    update: { maxDailyOutreach: max }
  });
  return NextResponse.json({ userSettings: { maxDailyOutreach: row.maxDailyOutreach } });
}
