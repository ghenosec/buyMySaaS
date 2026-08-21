-- CreateTable
CREATE TABLE "SaasBoost" (
    "userId" TEXT NOT NULL,
    "saasId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaasBoost_pkey" PRIMARY KEY ("userId","saasId")
);

-- CreateIndex
CREATE INDEX "SaasBoost_saasId_createdAt_idx" ON "SaasBoost"("saasId", "createdAt");

-- AddForeignKey
ALTER TABLE "SaasBoost" ADD CONSTRAINT "SaasBoost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasBoost" ADD CONSTRAINT "SaasBoost_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
