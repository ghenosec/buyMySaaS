-- CreateEnum
CREATE TYPE "PublicationOrderType" AS ENUM ('PUBLICATION_FEE', 'SPONSORED_PLACEMENT');

-- AlterTable
ALTER TABLE "PublicationOrder" ADD COLUMN "type" "PublicationOrderType" NOT NULL DEFAULT 'PUBLICATION_FEE';
ALTER TABLE "PublicationOrder" ADD COLUMN "entitlementDays" INTEGER;

-- AlterTable
ALTER TABLE "Saas" ADD COLUMN "sponsoredUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SaasSponsorship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saasId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaasSponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaasSponsorship_orderId_key" ON "SaasSponsorship"("orderId");

-- CreateIndex
CREATE INDEX "SaasSponsorship_saasId_endsAt_idx" ON "SaasSponsorship"("saasId", "endsAt");

-- CreateIndex
CREATE INDEX "SaasSponsorship_userId_createdAt_idx" ON "SaasSponsorship"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Saas_status_sponsoredUntil_idx" ON "Saas"("status", "sponsoredUntil");

-- CreateIndex
CREATE INDEX "PublicationOrder_saasId_type_status_idx" ON "PublicationOrder"("saasId", "type", "status");

-- AddForeignKey
ALTER TABLE "SaasSponsorship" ADD CONSTRAINT "SaasSponsorship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasSponsorship" ADD CONSTRAINT "SaasSponsorship_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasSponsorship" ADD CONSTRAINT "SaasSponsorship_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PublicationOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
