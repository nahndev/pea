-- AlterTable
ALTER TABLE "analysis_contexts" ADD COLUMN "path" VARCHAR(300);

UPDATE "analysis_contexts" SET "path" = "analysis_id"::text || '/' || "file";

ALTER TABLE "analysis_contexts" ALTER COLUMN "path" SET NOT NULL;
