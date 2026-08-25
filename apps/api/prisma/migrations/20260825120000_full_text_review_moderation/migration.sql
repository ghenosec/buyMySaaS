-- Advanced catalog search: weighted Portuguese full-text plus trigram fallback.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- PostgreSQL marks array_to_string as stable. This immutable wrapper makes it
-- safe for a stored generated column because tags and technologies are text[].
CREATE FUNCTION bms_array_to_string(text[], text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS 'SELECT array_to_string($1, $2)';

ALTER TABLE "Saas"
ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce("tagline", '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce("shortDescription", '')), 'B') ||
  setweight(to_tsvector('portuguese', coalesce("description", '')), 'C') ||
  setweight(to_tsvector('portuguese', bms_array_to_string("tags", ' ')), 'A') ||
  setweight(to_tsvector('portuguese', bms_array_to_string("technologies", ' ')), 'B')
) STORED;

CREATE INDEX "Saas_searchVector_idx" ON "Saas" USING GIN ("searchVector");
CREATE INDEX "Saas_name_trgm_idx" ON "Saas" USING GIN (lower("name") gin_trgm_ops);
CREATE INDEX "Saas_tagline_trgm_idx" ON "Saas" USING GIN (lower("tagline") gin_trgm_ops);

CREATE TYPE "ReviewModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Review"
ADD COLUMN "moderationStatus" "ReviewModerationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "moderationReason" TEXT,
ADD COLUMN "moderatedAt" TIMESTAMP(3),
ADD COLUMN "moderatedById" TEXT;

-- Preserve the visibility of reviews that were already public before this migration.
UPDATE "Review"
SET "moderationStatus" = CASE
  WHEN "hidden" = false THEN 'APPROVED'::"ReviewModerationStatus"
  ELSE 'PENDING'::"ReviewModerationStatus"
END;

ALTER TABLE "Review" ALTER COLUMN "hidden" SET DEFAULT true;

CREATE INDEX "Review_moderationStatus_createdAt_idx"
ON "Review"("moderationStatus", "createdAt");
