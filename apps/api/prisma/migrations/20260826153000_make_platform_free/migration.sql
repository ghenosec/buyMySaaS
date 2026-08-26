-- Existing submissions waiting for payment now enter the normal moderation queue.
UPDATE "Saas"
SET "status" = 'PENDING_REVIEW'
WHERE "status" = 'PENDING_PAYMENT';

-- Preserve historical purchase-click metrics as regular website clicks.
UPDATE "AnalyticsEvent"
SET "type" = 'WEBSITE_CLICK'
WHERE "type" = 'BUY_CLICK';

-- Remove payment, checkout and paid-placement persistence.
DROP TABLE IF EXISTS "SaasSponsorship";
DROP TABLE IF EXISTS "PublicationOrder";
DROP TABLE IF EXISTS "WebhookEvent";

DROP INDEX IF EXISTS "Saas_status_sponsoredUntil_idx";
ALTER TABLE "Saas"
  DROP COLUMN IF EXISTS "checkoutUrl",
  DROP COLUMN IF EXISTS "sponsoredUntil";

-- PostgreSQL enum values cannot be removed in place, so rebuild both enums.
CREATE TYPE "SaasStatus_free" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED'
);
ALTER TABLE "Saas" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Saas"
  ALTER COLUMN "status" TYPE "SaasStatus_free"
  USING ("status"::text::"SaasStatus_free");
DROP TYPE "SaasStatus";
ALTER TYPE "SaasStatus_free" RENAME TO "SaasStatus";
ALTER TABLE "Saas" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE TYPE "AnalyticsEventType_free" AS ENUM (
  'PAGE_VIEW',
  'WEBSITE_CLICK',
  'TRIAL_CLICK',
  'FAVORITE'
);
ALTER TABLE "AnalyticsEvent"
  ALTER COLUMN "type" TYPE "AnalyticsEventType_free"
  USING ("type"::text::"AnalyticsEventType_free");
DROP TYPE "AnalyticsEventType";
ALTER TYPE "AnalyticsEventType_free" RENAME TO "AnalyticsEventType";

DROP TYPE IF EXISTS "PublicationOrderStatus";
DROP TYPE IF EXISTS "PublicationOrderType";
DROP TYPE IF EXISTS "PaymentProviderName";
