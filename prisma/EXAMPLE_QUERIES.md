# Example Prisma Client usage

Assume `const prisma = new PrismaClient()` and helpers that clamp daily cap to `20..30`.

## 1) Generate today’s capped outreach (20–30)

Concept: pick eligible leads (not `Dead` / `NoFurtherFollowUp` / `BookedCall`, `totalTouches < 3`), rank by tier and recency, cap at `settings.maxDailyOutreach`, create `Task` rows with `type: Outreach` and `aiGenerated: true` if the AI planned them.

```ts
const cap = Math.min(30, Math.max(20, settings.maxDailyOutreach));

const eligible = await prisma.lead.findMany({
  where: {
    status: { notIn: [LeadStatus.Dead, LeadStatus.NoFurtherFollowUp, LeadStatus.BookedCall] },
    totalTouches: { lt: 3 },
  },
  orderBy: [{ tier: "asc" }, { lastContactDate: "asc" }],
  take: cap,
});

await prisma.$transaction(
  eligible.map((lead) =>
    prisma.task.create({
      data: {
        leadId: lead.id,
        type: TaskType.Outreach,
        status: TaskStatus.Pending,
        dueDate: new Date(),
        aiGenerated: true,
        aiInstructions: `Outreach slot; tier ${lead.tier}; pick best active script for stage.`,
      },
    })
  )
);
```

## 2) Update a lead after a touch (touchpoint + lead counters + status rule)

Rule: when `totalTouches` reaches `3`, set `status` to `NoFurtherFollowUp`.

```ts
await prisma.$transaction(async (tx) => {
  await tx.touchpoint.create({
    data: {
      leadId,
      scriptId,
      type: TouchpointType.Email,
      outcome: TouchpointOutcome.Replied,
      notes: "Sent follow-up #2",
    },
  });

  const lead = await tx.lead.update({
    where: { id: leadId },
    data: {
      totalTouches: { increment: 1 },
      lastContactDate: new Date(),
      status: LeadStatus.Contacted, // or map outcome → Replied / BookedCall in app logic
    },
  });

  if (lead.totalTouches >= 3) {
    await tx.lead.update({
      where: { id: leadId },
      data: { status: LeadStatus.NoFurtherFollowUp },
    });
  }
});
```

## 3) Update `Script.performanceScore` from outcomes (recommended)

Prefer recomputing from aggregates instead of blind `increment` on the score field:

```ts
const agg = await prisma.touchpoint.groupBy({
  by: ["outcome"],
  where: { scriptId },
  _count: { outcome: true },
});

const total = Object.values(agg).reduce((s, g) => s + g._count.outcome, 0);
const replies = agg.find((g) => g.outcome === TouchpointOutcome.Replied)?._count.outcome ?? 0;
const booked = agg.find((g) => g.outcome === TouchpointOutcome.BookedCall)?._count.outcome ?? 0;
const score = total > 0 ? (booked + 0.5 * replies) / total : 0;

await prisma.script.update({
  where: { id: scriptId },
  data: { performanceScore: score },
});
```

## 4) AI enrichment: create `Task` with `type: Enrichment`

When tier ≥ 4 and `(email` missing OR `phone` missing)` and policy allows:

```ts
await prisma.task.create({
  data: {
    leadId,
    type: TaskType.Enrichment,
    status: TaskStatus.Pending,
    dueDate: new Date(),
    aiGenerated: true,
    aiInstructions: "Enrich contact: find email/phone from website or provider API.",
  },
});

await prisma.lead.update({
  where: { id: leadId },
  data: { enrichmentAttempts: { increment: 1 } },
});
```
