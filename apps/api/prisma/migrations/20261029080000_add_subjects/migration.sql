CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "subjects" (
    "uuid" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "subjects_type_idx" ON "subjects"("type");

-- Existing subjects are all API endpoints; uuid-v5 of `API:<subject>` in the app's namespace
INSERT INTO "subjects" ("uuid", "type", "description")
SELECT uuid_generate_v5('9f2b8c4e-5a1d-4e6b-8c3f-7d0a1b2c3e4f', 'API:' || "subject"), 'API', "subject"
FROM (SELECT DISTINCT "subject" FROM "metric_results" WHERE "subject" <> '') AS "s";

-- AlterTable
ALTER TABLE "metric_results" ADD COLUMN "subject_uuid" UUID;

UPDATE "metric_results"
SET "subject_uuid" = uuid_generate_v5('9f2b8c4e-5a1d-4e6b-8c3f-7d0a1b2c3e4f', 'API:' || "subject")
WHERE "subject" <> '';

-- DropIndex
DROP INDEX "metric_results_analysis_result_id_metric_id_subject_key";

-- AlterTable
ALTER TABLE "metric_results" DROP COLUMN "subject";

-- CreateIndex
CREATE UNIQUE INDEX "metric_results_analysis_result_id_metric_id_subject_uuid_key" ON "metric_results"("analysis_result_id", "metric_id", "subject_uuid");

-- AddForeignKey
ALTER TABLE "metric_results" ADD CONSTRAINT "metric_results_subject_uuid_fkey" FOREIGN KEY ("subject_uuid") REFERENCES "subjects"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
