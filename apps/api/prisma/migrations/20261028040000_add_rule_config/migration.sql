-- AlterTable
ALTER TABLE "rules" ADD COLUMN "config" JSONB NOT NULL DEFAULT '{}';
