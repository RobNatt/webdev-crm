import { ScriptType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { scriptToApi } from "../../../lib/mappers";
import { prisma } from "../../../lib/prisma";

function parseScriptType(raw: unknown): ScriptType {
  const s = String(raw ?? "cold_email");
  if (s === "cold_call") return ScriptType.cold_call;
  if (s === "follow_up") return ScriptType.follow_up;
  return ScriptType.cold_email;
}

export async function GET() {
  const rows = await prisma.script.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ scripts: rows.map(scriptToApi) });
}

export async function POST(request: NextRequest) {
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
  return NextResponse.json({ script: scriptToApi(created) }, { status: 201 });
}
