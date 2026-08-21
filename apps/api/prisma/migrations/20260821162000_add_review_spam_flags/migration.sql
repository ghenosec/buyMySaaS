ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "spam" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "spamTerms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "Review_saasId_spam_createdAt_idx"
ON "Review"("saasId", "spam", "createdAt");
