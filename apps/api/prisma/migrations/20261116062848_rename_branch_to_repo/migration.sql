-- Branches and their analyses are dropped, not migrated
DELETE FROM "analyses";

-- DropForeignKey
ALTER TABLE "analyses" DROP CONSTRAINT "analyses_branch_id_fkey";

-- DropIndex
DROP INDEX "analyses_branch_id_schema_created_at_idx";

-- AlterTable
ALTER TABLE "analyses" DROP COLUMN "branch_id",
ADD COLUMN     "repo_id" UUID NOT NULL;

-- DropTable
DROP TABLE "branches";

-- CreateTable
CREATE TABLE "repos" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,

    CONSTRAINT "repos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "repos_name_key" ON "repos"("name");

-- CreateIndex
CREATE UNIQUE INDEX "repos_slug_key" ON "repos"("slug");

-- CreateIndex
CREATE INDEX "analyses_repo_id_schema_created_at_idx" ON "analyses"("repo_id", "schema", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "repos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenamePermissions: branch:* → repo:*
UPDATE "groups"
SET "permissions" = ARRAY(SELECT regexp_replace(permission, '^branch:', 'repo:') FROM unnest("permissions") AS permission)
WHERE EXISTS (SELECT 1 FROM unnest("permissions") AS permission WHERE permission LIKE 'branch:%');
