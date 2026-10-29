-- CreateIndex
CREATE UNIQUE INDEX "metric_conditions_quality_gate_id_metric_id_key" ON "metric_conditions"("quality_gate_id", "metric_id");
