DELETE FROM "Saas"
WHERE "slug" IN (
  'metricfox',
  'notaflow',
  'deploymate',
  'copylume',
  'pixboard',
  'formbee',
  'queuepilot',
  'shoppulse',
  'briefly',
  'tutorloop',
  'safewebhook',
  'peopleping',
  'postmint',
  'autodesk-br',
  'leadgarden'
);

DROP TABLE "Deal";
DROP TYPE "DealType";
