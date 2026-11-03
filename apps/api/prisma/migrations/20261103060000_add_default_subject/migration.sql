-- At most one DEFAULT subject
CREATE UNIQUE INDEX "subjects_default_type_key" ON "subjects"("type") WHERE (type = 'DEFAULT');

-- DEFAULT_SUBJECT: uuid-v5 of `DEFAULT:All requests` in the app's namespace
INSERT INTO "subjects" ("uuid", "type", "description")
VALUES ('0dd4c91b-3232-5445-a3e8-e8bcf153b4a9', 'DEFAULT', 'All requests')
ON CONFLICT DO NOTHING;

UPDATE "issues" SET "subject_uuid" = '0dd4c91b-3232-5445-a3e8-e8bcf153b4a9' WHERE "subject_uuid" IS NULL;

INSERT INTO "issue_subjects" ("id", "rule_id", "subject_uuid", "updated_at")
SELECT gen_random_uuid(), "rule_id", '0dd4c91b-3232-5445-a3e8-e8bcf153b4a9', CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "rule_id" FROM "issues" WHERE "subject_uuid" = '0dd4c91b-3232-5445-a3e8-e8bcf153b4a9') AS "s"
ON CONFLICT DO NOTHING;

-- AlterTable
ALTER TABLE "issues" ALTER COLUMN "subject_uuid" SET NOT NULL;
