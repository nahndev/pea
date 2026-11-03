-- AlterTable
ALTER TABLE "metric_conditions" ADD COLUMN "aggregates" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "metric_evaluations" ADD COLUMN "aggregate" VARCHAR(10) NOT NULL DEFAULT 'NONE',
ADD COLUMN "baseline" DOUBLE PRECISION;

-- DropIndex
DROP INDEX "metric_evaluations_metric_result_id_metric_condition_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "metric_evaluations_metric_result_id_metric_condition_id_agg_key" ON "metric_evaluations"("metric_result_id", "metric_condition_id", "aggregate");
