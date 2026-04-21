import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid script id" }, { status: 400 });
  }
  try {
    await prisma.script.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, deletedId: id });
}
