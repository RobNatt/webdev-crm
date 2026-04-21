import { TouchOutcome } from "@prisma/client";
import { prisma } from "./prisma";

export async function recomputeScriptStats(scriptId: number) {
  const agg = await prisma.touchpoint.groupBy({
    by: ["outcome"],
    where: { scriptId },
    _count: { _all: true }
  });
  let totalSends = 0;
  let replies = 0;
  let bookedCalls = 0;
  for (const row of agg) {
    const c = row._count._all;
    totalSends += c;
    if (row.outcome === TouchOutcome.replied) replies += c;
    if (row.outcome === TouchOutcome.booked_call) bookedCalls += c;
  }
  const performanceScore = totalSends > 0 ? Number(((bookedCalls + 0.5 * replies) / totalSends).toFixed(4)) : 0;
  await prisma.script.update({
    where: { id: scriptId },
    data: { totalSends, replies, bookedCalls, performanceScore }
  });
}
