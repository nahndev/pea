-- AlterTable
ALTER TABLE "analysis_contexts" ADD COLUMN "type" VARCHAR(50);

UPDATE "analysis_contexts" SET "type" = UPPER(regexp_replace("file", '\.log$', ''));

ALTER TABLE "analysis_contexts" ALTER COLUMN "type" SET NOT NULL;

-- CreateIndex
CREATE INDEX "analysis_contexts_type_idx" ON "analysis_contexts"("type");
