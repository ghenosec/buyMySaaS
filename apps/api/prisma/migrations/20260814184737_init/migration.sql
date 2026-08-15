-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SaasStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FREE', 'FREEMIUM', 'SUBSCRIPTION', 'ONE_TIME', 'LIFETIME', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('LIFETIME', 'DISCOUNT', 'COUPON');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'WEBSITE_CLICK', 'TRIAL_CLICK', 'BUY_CLICK', 'FAVORITE');

-- CreateEnum
CREATE TYPE "PublicationOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProviderName" AS ENUM ('MOCK', 'MERCADO_PAGO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Saas" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "accentColor" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'BR',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "websiteUrl" TEXT NOT NULL,
    "trialUrl" TEXT,
    "checkoutUrl" TEXT,
    "docsUrl" TEXT,
    "demoUrl" TEXT,
    "pricingType" "PricingType" NOT NULL,
    "priceCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "billingInterval" "BillingInterval",
    "pricingLabel" TEXT,
    "isBrazilian" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "technologies" TEXT[],
    "status" "SaasStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "launchDate" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Saas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaasScreenshot" (
    "id" TEXT NOT NULL,
    "saasId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SaasScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaasCategory" (
    "saasId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "SaasCategory_pkey" PRIMARY KEY ("saasId","categoryId")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "saasId" TEXT NOT NULL,
    "type" "DealType" NOT NULL,
    "originalPriceCents" INTEGER,
    "promotionalPriceCents" INTEGER,
    "discountPercent" INTEGER,
    "couponCode" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "licenseLimit" INTEGER,
    "soldCount" INTEGER,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saasId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "saasId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","saasId")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "saasId" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "referrer" TEXT,
    "visitorHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicationOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "saasId" TEXT NOT NULL,
    "provider" "PaymentProviderName" NOT NULL,
    "providerPaymentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PublicationOrderStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Saas_slug_key" ON "Saas"("slug");

-- CreateIndex
CREATE INDEX "Saas_status_publishedAt_idx" ON "Saas"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Saas_ownerId_status_idx" ON "Saas"("ownerId", "status");

-- CreateIndex
CREATE INDEX "Saas_priceCents_idx" ON "Saas"("priceCents");

-- CreateIndex
CREATE INDEX "SaasScreenshot_saasId_position_idx" ON "SaasScreenshot"("saasId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_saasId_key" ON "Deal"("saasId");

-- CreateIndex
CREATE INDEX "Deal_startsAt_endsAt_idx" ON "Deal"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Review_saasId_createdAt_idx" ON "Review"("saasId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_saasId_key" ON "Review"("userId", "saasId");

-- CreateIndex
CREATE INDEX "Favorite_saasId_createdAt_idx" ON "Favorite"("saasId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_saasId_type_createdAt_idx" ON "AnalyticsEvent"("saasId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublicationOrder_providerPaymentId_key" ON "PublicationOrder"("providerPaymentId");

-- CreateIndex
CREATE INDEX "PublicationOrder_saasId_status_idx" ON "PublicationOrder"("saasId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "Saas" ADD CONSTRAINT "Saas_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasScreenshot" ADD CONSTRAINT "SaasScreenshot_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasCategory" ADD CONSTRAINT "SaasCategory_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasCategory" ADD CONSTRAINT "SaasCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationOrder" ADD CONSTRAINT "PublicationOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationOrder" ADD CONSTRAINT "PublicationOrder_saasId_fkey" FOREIGN KEY ("saasId") REFERENCES "Saas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
