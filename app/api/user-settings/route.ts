import { NextRequest } from "next/server";
import { dbErrorResponse } from "../../../lib/dbErrorResponse";
import { jsonNoStore } from "../../../lib/jsonNoStore";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await prisma.userSettings.upsert({
      where: { id: "default" },
      create: { id: "default", maxDailyOutreach: 30 },
      update: {}
    });
    return jsonNoStore({ userSettings: { maxDailyOutreach: row.maxDailyOutreach } });
  } catch (e) {
    return dbErrorResponse(e);
  }
}

export async function PATCH(request: NextRequest) {
  try {
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
    return jsonNoStore({ userSettings: { maxDailyOutreach: row.maxDailyOutreach } });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
