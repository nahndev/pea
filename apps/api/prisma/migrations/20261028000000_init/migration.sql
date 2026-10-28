-- CreateTable
CREATE TABLE "merge_requests" (
    "id" UUID NOT NULL,
    "iid" INTEGER NOT NULL,

    CONSTRAINT "merge_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" UUID NOT NULL,
    "merge_request_id" UUID NOT NULL,
    "commit_sha" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_contexts" (
    "id" UUID NOT NULL,
    "analysis_id" UUID NOT NULL,
    "file" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merge_requests_iid_key" ON "merge_requests"("iid");

-- CreateIndex
CREATE INDEX "analyses_merge_request_id_created_at_idx" ON "analyses"("merge_request_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "analysis_contexts_analysis_id_file_key" ON "analysis_contexts"("analysis_id", "file");

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_merge_request_id_fkey" FOREIGN KEY ("merge_request_id") REFERENCES "merge_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_contexts" ADD CONSTRAINT "analysis_contexts_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

