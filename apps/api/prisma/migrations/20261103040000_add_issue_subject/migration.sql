-- AlterTable
ALTER TABLE "issues" ADD COLUMN "subject_uuid" UUID;

-- CreateIndex
CREATE INDEX "issues_subject_uuid_idx" ON "issues"("subject_uuid");

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_subject_uuid_fkey" FOREIGN KEY ("subject_uuid") REFERENCES "subjects"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
