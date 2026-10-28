-- Existing analyses are tied to merge requests; clear them (cascades to contexts, results, issues, metrics)
DELETE FROM "analyses";

-- DropForeignKey
ALTER TABLE "analyses" DROP CONSTRAINT "analyses_merge_request_id_fkey";

-- DropIndex
DROP INDEX "analyses_merge_request_id_created_at_idx";

-- AlterTable
ALTER TABLE "analyses" DROP COLUMN "commit_sha",
DROP COLUMN "merge_request_id",
ADD COLUMN     "branch_id" UUID NOT NULL;

-- DropTable
DROP TABLE "merge_requests";

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_name_key" ON "branches"("name");

-- CreateIndex
CREATE INDEX "analyses_branch_id_created_at_idx" ON "analyses"("branch_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
