-- AlterTable
ALTER TABLE "issues" ADD COLUMN "analysis_result_id" UUID;

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    "issue_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analysis_results_analysis_id_created_at_idx" ON "analysis_results"("analysis_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "issues_analysis_result_id_idx" ON "issues"("analysis_result_id");

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_analysis_result_id_fkey" FOREIGN KEY ("analysis_result_id") REFERENCES "analysis_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
