-- CreateTable
CREATE TABLE "databases" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "connection" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "databases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "databases_name_key" ON "databases"("name");

-- AlterTable
ALTER TABLE "database_analysis_data" ADD COLUMN "database_id" UUID;

-- MigrateData: one database per existing analysis, reusing the analysis id
INSERT INTO "databases" ("id", "name", "connection", "updated_at")
SELECT d."analysis_id", LEFT(a."title", 240) || ' (' || LEFT(d."analysis_id"::text, 8) || ')', d."connection", CURRENT_TIMESTAMP
FROM "database_analysis_data" d
JOIN "analyses" a ON a."id" = d."analysis_id";

UPDATE "database_analysis_data" SET "database_id" = "analysis_id";

-- AlterTable
ALTER TABLE "database_analysis_data" DROP COLUMN "connection",
ALTER COLUMN "database_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "database_analysis_data_database_id_idx" ON "database_analysis_data"("database_id");

-- AddForeignKey
ALTER TABLE "database_analysis_data" ADD CONSTRAINT "database_analysis_data_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "databases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
