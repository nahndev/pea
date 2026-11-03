-- CreateTable
CREATE TABLE "api_analysis_data" (
    "analysis_id" UUID NOT NULL,
    "file" VARCHAR(255) NOT NULL,
    "path" VARCHAR(300) NOT NULL,

    CONSTRAINT "api_analysis_data_pkey" PRIMARY KEY ("analysis_id")
);

-- CreateTable
CREATE TABLE "database_analysis_data" (
    "analysis_id" UUID NOT NULL,
    "connection" TEXT NOT NULL,

    CONSTRAINT "database_analysis_data_pkey" PRIMARY KEY ("analysis_id")
);

-- AddForeignKey
ALTER TABLE "api_analysis_data" ADD CONSTRAINT "api_analysis_data_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "database_analysis_data" ADD CONSTRAINT "database_analysis_data_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData
INSERT INTO "api_analysis_data" ("analysis_id", "file", "path")
SELECT "id", "file", "path" FROM "analyses" WHERE "file" IS NOT NULL AND "path" IS NOT NULL;

INSERT INTO "database_analysis_data" ("analysis_id", "connection")
SELECT "id", "connection" FROM "analyses" WHERE "connection" IS NOT NULL;

-- AlterTable
ALTER TABLE "analyses" DROP COLUMN "connection",
DROP COLUMN "file",
DROP COLUMN "path";
