/*
  Warnings:

  - Made the column `searchVector` on table `Saas` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Saas_isAdult_status_idx";

-- DropIndex
DROP INDEX "Saas_searchVector_idx";

-- AlterTable
ALTER TABLE "Saas" ALTER COLUMN "searchVector" SET NOT NULL;
