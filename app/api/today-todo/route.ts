import { NextRequest, NextResponse } from "next/server";
import { generateTodayTodo, getEffectiveCap, getMaxDailyOutreach } from "../../../lib/todayTodo";

export async function GET(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("limit");
  const requestedLimit = rawLimit ? Number(rawLimit) : undefined;
  const settingsCap = await getMaxDailyOutreach();
  const effectiveCap = getEffectiveCap(requestedLimit, settingsCap);
  const items = await generateTodayTodo(requestedLimit);
  return NextResponse.json({
    requestedLimit: requestedLimit ?? null,
    effectiveCap,
    todayOutreachCount: items.length,
    items
  });
}
