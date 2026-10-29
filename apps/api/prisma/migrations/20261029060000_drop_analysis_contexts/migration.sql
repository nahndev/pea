-- AlterTable
ALTER TABLE "analyses" ADD COLUMN "file" VARCHAR(255), ADD COLUMN "path" VARCHAR(300);

UPDATE "analyses" SET "file" = "c"."file", "path" = "c"."path"
FROM "analysis_contexts" "c"
WHERE "c"."analysis_id" = "analyses"."id" AND "c"."type" = 'API_METRIC';

DELETE FROM "analyses" WHERE "file" IS NULL;

DELETE FROM "metric_results" WHERE "analysis_context_id" IN (SELECT "id" FROM "analysis_contexts" WHERE "type" <> 'API_METRIC');
DELETE FROM "issues" WHERE "analysis_context_id" IN (SELECT "id" FROM "analysis_contexts" WHERE "type" <> 'API_METRIC');

ALTER TABLE "analyses" ALTER COLUMN "file" SET NOT NULL, ALTER COLUMN "path" SET NOT NULL;

-- AlterTable
ALTER TABLE "issues" DROP COLUMN "analysis_context_id";

-- AlterTable
ALTER TABLE "metric_results" DROP COLUMN "analysis_context_id";

-- DropTable
DROP TABLE "analysis_contexts";

-- CreateIndex
CREATE UNIQUE INDEX "metric_results_analysis_result_id_metric_id_subject_key" ON "metric_results"("analysis_result_id", "metric_id", "subject");
