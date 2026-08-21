ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");

INSERT INTO "Category" ("id", "name", "slug", "description", "icon")
VALUES (
  '00000000-0000-4000-8000-000000000018',
  'Adulto +18',
  'adulto-18',
  'Produtos destinados somente a maiores de 18 anos',
  'BadgeAlert'
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "icon" = EXCLUDED."icon";

DELETE FROM "Category"
WHERE "slug" IN (
  'feito-no-brasil',
  'feitos-no-brasil',
  'brasil',
  'made-in-brazil'
);
