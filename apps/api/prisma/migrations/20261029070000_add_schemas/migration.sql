-- AlterTable
ALTER TABLE "analyses" ADD COLUMN "schema" VARCHAR(20) NOT NULL DEFAULT 'API';
ALTER TABLE "analyses" ALTER COLUMN "schema" DROP DEFAULT;

ALTER TABLE "rules" ADD COLUMN "schema" VARCHAR(20) NOT NULL DEFAULT 'API';
ALTER TABLE "rules" ALTER COLUMN "schema" DROP DEFAULT;

ALTER TABLE "metrics" ADD COLUMN "schema" VARCHAR(20) NOT NULL DEFAULT 'API';
ALTER TABLE "metrics" ALTER COLUMN "schema" DROP DEFAULT;

-- DropIndex
DROP INDEX "analyses_branch_id_created_at_idx";
DROP INDEX "rules_type_idx";
DROP INDEX "metrics_type_idx";

-- CreateIndex
CREATE INDEX "analyses_branch_id_schema_created_at_idx" ON "analyses"("branch_id", "schema", "created_at" DESC);
CREATE INDEX "rules_schema_type_idx" ON "rules"("schema", "type");
CREATE INDEX "metrics_schema_type_idx" ON "metrics"("schema", "type");

-- Keep one condition per metric (the oldest) before dropping quality gates
DELETE FROM "metric_conditions" c
USING "metric_conditions" o
WHERE c."metric_id" = o."metric_id"
  AND (c."created_at", c."id") > (o."created_at", o."id");

-- DropForeignKey
ALTER TABLE "metric_conditions" DROP CONSTRAINT "metric_conditions_quality_gate_id_fkey";

-- DropIndex
DROP INDEX "metric_conditions_quality_gate_id_metric_id_key";
DROP INDEX "metric_conditions_quality_gate_id_idx";
DROP INDEX "metric_conditions_metric_id_idx";

-- AlterTable
ALTER TABLE "metric_conditions" DROP COLUMN "quality_gate_id";

-- CreateIndex
CREATE UNIQUE INDEX "metric_conditions_metric_id_key" ON "metric_conditions"("metric_id");

-- DropTable
DROP TABLE "quality_gates";
