-- CreateTable
CREATE TABLE "database_query_stats" (
    "database_id" UUID NOT NULL,
    "queries" JSONB NOT NULL,
    "taken_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_query_stats_pkey" PRIMARY KEY ("database_id")
);

-- AddForeignKey
ALTER TABLE "database_query_stats" ADD CONSTRAINT "database_query_stats_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "databases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
