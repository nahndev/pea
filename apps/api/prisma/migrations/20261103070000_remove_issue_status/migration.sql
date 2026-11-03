-- DropIndex
DROP INDEX "issues_status_idx";

-- AlterTable
ALTER TABLE "issues" DROP COLUMN "status";

-- Every issue needs its issue subject before the foreign key
INSERT INTO "issue_subjects" ("id", "rule_id", "subject_uuid", "updated_at")
SELECT gen_random_uuid(), "rule_id", "subject_uuid", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "rule_id", "subject_uuid" FROM "issues") AS "s"
ON CONFLICT DO NOTHING;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_rule_id_subject_uuid_fkey" FOREIGN KEY ("rule_id", "subject_uuid") REFERENCES "issue_subjects"("rule_id", "subject_uuid") ON DELETE CASCADE ON UPDATE CASCADE;
