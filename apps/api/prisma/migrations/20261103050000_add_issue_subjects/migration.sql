-- CreateTable
CREATE TABLE "issue_subjects" (
    "id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "subject_uuid" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'TO_REVIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issue_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_subjects_subject_uuid_idx" ON "issue_subjects"("subject_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "issue_subjects_rule_id_subject_uuid_key" ON "issue_subjects"("rule_id", "subject_uuid");

-- AddForeignKey
ALTER TABLE "issue_subjects" ADD CONSTRAINT "issue_subjects_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_subjects" ADD CONSTRAINT "issue_subjects_subject_uuid_fkey" FOREIGN KEY ("subject_uuid") REFERENCES "subjects"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing issues with a subject start in TO_REVIEW
INSERT INTO "issue_subjects" ("id", "rule_id", "subject_uuid", "updated_at")
SELECT gen_random_uuid(), "rule_id", "subject_uuid", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "rule_id", "subject_uuid" FROM "issues" WHERE "subject_uuid" IS NOT NULL) AS "s";
