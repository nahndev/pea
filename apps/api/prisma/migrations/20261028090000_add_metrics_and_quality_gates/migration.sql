-- CreateTable
CREATE TABLE "metrics" (
    "id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_results" (
    "id" UUID NOT NULL,
    "metric_id" UUID NOT NULL,
    "analysis_result_id" UUID NOT NULL,
    "analysis_context_id" UUID NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_gates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_gates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_conditions" (
    "id" UUID NOT NULL,
    "quality_gate_id" UUID NOT NULL,
    "metric_id" UUID NOT NULL,
    "operator" VARCHAR(10) NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_evaluations" (
    "id" UUID NOT NULL,
    "metric_result_id" UUID NOT NULL,
    "metric_condition_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "operator" VARCHAR(10) NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metrics_type_idx" ON "metrics"("type");

-- CreateIndex
CREATE INDEX "metric_results_metric_id_created_at_idx" ON "metric_results"("metric_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "metric_results_analysis_context_id_idx" ON "metric_results"("analysis_context_id");

-- CreateIndex
CREATE UNIQUE INDEX "metric_results_analysis_result_id_analysis_context_id_metri_key" ON "metric_results"("analysis_result_id", "analysis_context_id", "metric_id");

-- CreateIndex
CREATE UNIQUE INDEX "quality_gates_name_key" ON "quality_gates"("name");

-- CreateIndex
CREATE INDEX "metric_conditions_quality_gate_id_idx" ON "metric_conditions"("quality_gate_id");

-- CreateIndex
CREATE INDEX "metric_conditions_metric_id_idx" ON "metric_conditions"("metric_id");

-- CreateIndex
CREATE INDEX "metric_evaluations_metric_condition_id_idx" ON "metric_evaluations"("metric_condition_id");

-- CreateIndex
CREATE UNIQUE INDEX "metric_evaluations_metric_result_id_metric_condition_id_key" ON "metric_evaluations"("metric_result_id", "metric_condition_id");

-- AddForeignKey
ALTER TABLE "metric_results" ADD CONSTRAINT "metric_results_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_results" ADD CONSTRAINT "metric_results_analysis_result_id_fkey" FOREIGN KEY ("analysis_result_id") REFERENCES "analysis_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_results" ADD CONSTRAINT "metric_results_analysis_context_id_fkey" FOREIGN KEY ("analysis_context_id") REFERENCES "analysis_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_conditions" ADD CONSTRAINT "metric_conditions_quality_gate_id_fkey" FOREIGN KEY ("quality_gate_id") REFERENCES "quality_gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_conditions" ADD CONSTRAINT "metric_conditions_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_evaluations" ADD CONSTRAINT "metric_evaluations_metric_result_id_fkey" FOREIGN KEY ("metric_result_id") REFERENCES "metric_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metric_evaluations" ADD CONSTRAINT "metric_evaluations_metric_condition_id_fkey" FOREIGN KEY ("metric_condition_id") REFERENCES "metric_conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

