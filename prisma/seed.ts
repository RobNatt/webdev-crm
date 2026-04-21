import { ContactMethod, LeadNextAction, LeadStatus, ScriptType } from "@prisma/client";
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.userSettings.upsert({
    where: { id: "default" },
    create: { id: "default", maxDailyOutreach: 30 },
    update: {}
  });

  const leadCount = await prisma.lead.count();
  if (leadCount === 0) {
    await prisma.lead.createMany({
      data: [
        {
          companyName: "Acme Roofing",
          email: "",
          phone: "",
          tier: 2,
          status: LeadStatus.no_reply,
          nextAction: LeadNextAction.follow_up,
          nextActionDate: new Date("2026-04-21"),
          preferredContactMethod: ContactMethod.email,
          totalTouches: 1
        },
        {
          companyName: "NoSite Plumbing",
          email: "",
          phone: "",
          tier: 5,
          status: LeadStatus.active,
          nextAction: LeadNextAction.cold_call,
          nextActionDate: new Date("2026-04-21"),
          preferredContactMethod: ContactMethod.call,
          totalTouches: 0
        },
        {
          companyName: "Bright Dental",
          email: "hello@brightdental.com",
          phone: "",
          tier: 1,
          status: LeadStatus.replied,
          nextAction: LeadNextAction.follow_up,
          nextActionDate: new Date("2026-04-20"),
          preferredContactMethod: ContactMethod.email,
          totalTouches: 2,
          lastContactDate: new Date("2026-04-19")
        }
      ]
    });
  }

  const scriptCount = await prisma.script.count();
  if (scriptCount === 0) {
    await prisma.script.createMany({
      data: [
        {
          name: "Tier1 Cold Email A",
          type: ScriptType.cold_email,
          tier: 1,
          content: "Hi {{owner_name}}, quick website win for {{company_name}}...",
          totalSends: 20,
          replies: 6,
          bookedCalls: 2,
          performanceScore: 0.25
        },
        {
          name: "Tier2 Follow-up A",
          type: ScriptType.follow_up,
          tier: 2,
          content: "Quick follow-up on my note yesterday...",
          totalSends: 32,
          replies: 8,
          bookedCalls: 3,
          performanceScore: 0.3438
        },
        {
          name: "Tier5 Cold Call A",
          type: ScriptType.cold_call,
          tier: 5,
          content: "Hi, I help local businesses improve site conversion...",
          totalSends: 28,
          replies: 3,
          bookedCalls: 1,
          performanceScore: 0.0893
        }
      ]
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
