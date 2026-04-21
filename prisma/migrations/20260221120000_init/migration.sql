-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('active', 'no_reply', 'replied', 'booked_call', 'no_further_follow_up', 'dead');

-- CreateEnum
CREATE TYPE "LeadNextAction" AS ENUM ('cold_email', 'cold_call', 'follow_up', 'none');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('email', 'call');

-- CreateEnum
CREATE TYPE "ScriptType" AS ENUM ('cold_email', 'cold_call', 'follow_up');

-- CreateEnum
CREATE TYPE "TouchpointType" AS ENUM ('email', 'call');

-- CreateEnum
CREATE TYPE "TouchOutcome" AS ENUM ('no_reply', 'replied', 'booked_call');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('Tiering', 'Outreach', 'Enrichment');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Pending', 'Done', 'Failed');

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "website" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "ownerName" TEXT,
    "tier" INTEGER NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'active',
    "lastContactDate" TIMESTAMP(3),
    "totalTouches" INTEGER NOT NULL DEFAULT 0,
    "enrichmentAttempts" INTEGER NOT NULL DEFAULT 0,
    "nextAction" "LeadNextAction" NOT NULL DEFAULT 'cold_email',
    "nextActionDate" TIMESTAMP(3),
    "preferredContactMethod" "ContactMethod" NOT NULL DEFAULT 'email',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Script" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ScriptType" NOT NULL,
    "content" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSends" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "bookedCalls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Touchpoint" (
    "id" SERIAL NOT NULL,
    "type" "TouchpointType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "TouchOutcome" NOT NULL,
    "notes" TEXT,
    "leadId" INTEGER NOT NULL,
    "scriptId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Touchpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "type" "TaskType" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'Pending',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAppliedLead" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "appliedOn" DATE NOT NULL,

    CONSTRAINT "DailyAppliedLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "maxDailyOutreach" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_tier_idx" ON "Lead"("tier");

-- CreateIndex
CREATE INDEX "Lead_companyName_idx" ON "Lead"("companyName");

-- CreateIndex
CREATE INDEX "Lead_lastContactDate_idx" ON "Lead"("lastContactDate");

-- CreateIndex
CREATE INDEX "Script_active_type_tier_idx" ON "Script"("active", "type", "tier");

-- CreateIndex
CREATE INDEX "Touchpoint_leadId_date_idx" ON "Touchpoint"("leadId", "date");

-- CreateIndex
CREATE INDEX "Touchpoint_scriptId_idx" ON "Touchpoint"("scriptId");

-- CreateIndex
CREATE INDEX "Task_leadId_status_idx" ON "Task"("leadId", "status");

-- CreateIndex
CREATE INDEX "Task_type_status_idx" ON "Task"("type", "status");

-- CreateIndex
CREATE INDEX "DailyAppliedLead_appliedOn_idx" ON "DailyAppliedLead"("appliedOn");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAppliedLead_leadId_appliedOn_key" ON "DailyAppliedLead"("leadId", "appliedOn");

-- AddForeignKey
ALTER TABLE "Touchpoint" ADD CONSTRAINT "Touchpoint_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Touchpoint" ADD CONSTRAINT "Touchpoint_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAppliedLead" ADD CONSTRAINT "DailyAppliedLead_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
