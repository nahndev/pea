/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `branches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "slug" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "branches_slug_key" ON "branches"("slug");
