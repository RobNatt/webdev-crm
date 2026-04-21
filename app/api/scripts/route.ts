import { ScriptType } from "@prisma/client";
import { NextRequest } from "next/server";
import { dbErrorResponse } from "../../../lib/dbErrorResponse";
import { jsonNoStore } from "../../../lib/jsonNoStore";
import { scriptToApi } from "../../../lib/mappers";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

function parseScriptType(raw: unknown): ScriptType {
  const s = String(raw ?? "cold_email");
  if (s === "cold_call") return ScriptType.cold_call;
  if (s === "follow_up") return ScriptType.follow_up;
  return ScriptType.cold_email;
}

export async function GET() {
  try {
    const rows = await prisma.script.findMany({ orderBy: { id: "asc" } });
    return jsonNoStore({ scripts: rows.map(scriptToApi) });
  } catch (e) {
    return dbErrorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = parseScriptType(body.stage);

    const created = await prisma.script.create({
      data: {
        name: body.name ?? "Untitled script",
        type,
        tier: typeof body.tier === "number" ? body.tier : 3,
        content: body.content ?? "",
        active: true,
        totalSends: 0,
        replies: 0,
        bookedCalls: 0,
        performanceScore: 0
      }
    });
    return jsonNoStore({ script: scriptToApi(created) }, { status: 201 });
  } catch (e) {
    return dbErrorResponse(e);
  }
}
