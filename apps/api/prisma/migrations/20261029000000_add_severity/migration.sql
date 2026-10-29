-- AlterTable
ALTER TABLE "rules" ADD COLUMN "severity" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "issues" ADD COLUMN "severity" VARCHAR(20) NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "issues_severity_idx" ON "issues"("severity");

-- Default severity per rule type
UPDATE "rules" SET "severity" = 'HIGH' WHERE "type" IN ('P90_FAILURE', 'P95_FAILURE', 'P99_FAILURE', 'ROUTE_ERROR_RATE');
UPDATE "rules" SET "severity" = 'BLOCKER' WHERE "type" = 'ERROR_RATE';
UPDATE "rules" SET "severity" = 'LOW' WHERE "type" IN ('MAX_LATENCY', 'CLIENT_ERROR_RATE', 'SLOW_API');

-- Existing issues take the severity of their rule
UPDATE "issues" SET "severity" = "rules"."severity" FROM "rules" WHERE "issues"."rule_id" = "rules"."id";
