/*
  Warnings:

  - You are about to drop the column `merge_request_iid` on the `analyses` table. All the data in the column will be lost.
  - Added the required column `title` to the `analyses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "analyses" DROP COLUMN "merge_request_iid",
ADD COLUMN     "connection" TEXT,
ADD COLUMN     "title" VARCHAR(255) NOT NULL,
ALTER COLUMN "file" DROP NOT NULL,
ALTER COLUMN "path" DROP NOT NULL;
