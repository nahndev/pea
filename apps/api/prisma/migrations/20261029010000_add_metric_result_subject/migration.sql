-- DropIndex
DROP INDEX "metric_results_analysis_result_id_analysis_context_id_metri_key";

-- AlterTable
ALTER TABLE "metric_results" ADD COLUMN "subject" VARCHAR(255) NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "metric_results_analysis_result_id_analysis_context_id_metri_key" ON "metric_results"("analysis_result_id", "analysis_context_id", "metric_id", "subject");
