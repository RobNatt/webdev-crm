-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "noFurtherFollowUp" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Lead" SET "noFurtherFollowUp" = true WHERE status = 'dead';
