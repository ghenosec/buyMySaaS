import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { z } from 'zod';
import { join } from 'node:path';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { EngagementsModule } from './modules/engagements/engagements.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SaasModule } from './modules/saas/saas.module';
import { StorageModule } from './modules/storage/storage.module';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  PUBLICATION_FEE_CENTS: z.coerce.number().int().nonnegative().default(990),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '../../.env'), '.env'],
      validate: (config) => envSchema.passthrough().parse(config),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    SaasModule,
    EngagementsModule,
    AnalyticsModule,
    PaymentsModule,
    AdminModule,
    StorageModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
