-- CreateTable
CREATE TABLE "issues" (
    "id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "analysis_context_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issues_rule_id_idx" ON "issues"("rule_id");

-- CreateIndex
CREATE INDEX "issues_analysis_context_id_idx" ON "issues"("analysis_context_id");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "issues"("status");

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_analysis_context_id_fkey" FOREIGN KEY ("analysis_context_id") REFERENCES "analysis_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
