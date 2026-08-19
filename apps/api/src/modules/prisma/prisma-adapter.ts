import { PrismaPg } from '@prisma/adapter-pg';

export function createPrismaAdapter() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL não configurada');
  return new PrismaPg(connectionString);
}
