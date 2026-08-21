-- AlterTable
ALTER TABLE "Saas" ADD COLUMN "isAdult" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Saas_isAdult_status_idx" ON "Saas"("isAdult", "status");
