import { NextRequest } from "next/server";
import { dbErrorResponse } from "../../../lib/dbErrorResponse";
import { jsonNoStore } from "../../../lib/jsonNoStore";
import { generateTodayTodo, getEffectiveCap, getMaxDailyOutreach } from "../../../lib/todayTodo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const rawLimit = request.nextUrl.searchParams.get("limit");
    const requestedLimit = rawLimit ? Number(rawLimit) : undefined;
    const settingsCap = await getMaxDailyOutreach();
    const effectiveCap = getEffectiveCap(requestedLimit, settingsCap);
    const items = await generateTodayTodo(requestedLimit);
    return jsonNoStore({
      requestedLimit: requestedLimit ?? null,
      effectiveCap,
      todayOutreachCount: items.length,
      items
    });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
