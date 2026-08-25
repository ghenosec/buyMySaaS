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

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalNonEmptyString = (min = 1) =>
  z.preprocess(emptyToUndefined, z.string().min(min).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(32),
    AUTH_COOKIE_NAME: z.string().min(1).default('bms_session'),
    WEB_URL: z.string().url().default('http://localhost:3000'),
    API_URL: z.string().url().default('http://localhost:3001'),
    GOOGLE_CLIENT_ID: optionalNonEmptyString(),
    GOOGLE_CLIENT_SECRET: optionalNonEmptyString(),
    GOOGLE_REDIRECT_URI: optionalUrl,
    MODERATION_BLOCKED_TERMS: z.string().optional(),
    PUBLICATION_FEE_ENABLED: z.enum(['true', 'false']).default('false'),
    PUBLICATION_FEE_CENTS: z.coerce.number().int().nonnegative().default(990),
    PUBLICATION_FEE_CURRENCY: z.string().min(3).max(3).default('BRL'),
    SPONSORED_PLACEMENT_ENABLED: z.enum(['true', 'false']).default('true'),
    SPONSORED_PLACEMENT_PRICE_CENTS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(2990),
    SPONSORED_PLACEMENT_CURRENCY: z.string().min(3).max(3).default('BRL'),
    SPONSORED_PLACEMENT_DURATION_DAYS: z.coerce
      .number()
      .int()
      .positive()
      .default(7),
    PAYMENT_PROVIDER: z.enum(['mock', 'mercado_pago']).default('mock'),
    MERCADO_PAGO_ACCESS_TOKEN: optionalNonEmptyString(),
    MERCADO_PAGO_WEBHOOK_SECRET: optionalNonEmptyString(16),
    STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
    S3_BUCKET: optionalNonEmptyString(),
    FORCE_HTTPS: z.enum(['true', 'false']).default('false'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
    ENABLE_API_DOCS: z.enum(['true', 'false']).default('false'),
  })
  .passthrough()
  .superRefine((config, context) => {
    if (config.NODE_ENV === 'production') {
      for (const [name, value] of [
        ['WEB_URL', config.WEB_URL],
        ['API_URL', config.API_URL],
        ['GOOGLE_REDIRECT_URI', config.GOOGLE_REDIRECT_URI],
      ] as const) {
        if (!value || new URL(value).protocol !== 'https:')
          context.addIssue({
            code: 'custom',
            path: [name],
            message: `${name} deve usar HTTPS em produção`,
          });
      }
      if (!config.GOOGLE_CLIENT_ID)
        context.addIssue({
          code: 'custom',
          path: ['GOOGLE_CLIENT_ID'],
          message: 'GOOGLE_CLIENT_ID é obrigatório em produção',
        });
      if (!config.GOOGLE_CLIENT_SECRET)
        context.addIssue({
          code: 'custom',
          path: ['GOOGLE_CLIENT_SECRET'],
          message: 'GOOGLE_CLIENT_SECRET é obrigatório em produção',
        });
      if (config.AUTH_SECRET === 'dev-only-change-before-production-32chars')
        context.addIssue({
          code: 'custom',
          path: ['AUTH_SECRET'],
          message: 'Troque o AUTH_SECRET de desenvolvimento em produção',
        });
      if (config.FORCE_HTTPS !== 'true')
        context.addIssue({
          code: 'custom',
          path: ['FORCE_HTTPS'],
          message: 'FORCE_HTTPS deve estar ativo em produção',
        });
      if (
        (config.PUBLICATION_FEE_ENABLED === 'true' ||
          config.SPONSORED_PLACEMENT_ENABLED === 'true') &&
        config.PAYMENT_PROVIDER !== 'mercado_pago'
      )
        context.addIssue({
          code: 'custom',
          path: ['PAYMENT_PROVIDER'],
          message: 'Produção com pagamento ativo exige Mercado Pago',
        });
    }
    if (
      config.NODE_ENV === 'production' &&
      config.PAYMENT_PROVIDER === 'mercado_pago'
    ) {
      if (!config.MERCADO_PAGO_ACCESS_TOKEN)
        context.addIssue({
          code: 'custom',
          path: ['MERCADO_PAGO_ACCESS_TOKEN'],
          message: 'Token do Mercado Pago não configurado',
        });
      if (!config.MERCADO_PAGO_WEBHOOK_SECRET)
        context.addIssue({
          code: 'custom',
          path: ['MERCADO_PAGO_WEBHOOK_SECRET'],
          message: 'Secret do webhook do Mercado Pago não configurado',
        });
    }
    if (config.STORAGE_PROVIDER === 's3' && !config.S3_BUCKET)
      context.addIssue({
        code: 'custom',
        path: ['S3_BUCKET'],
        message: 'S3_BUCKET é obrigatório para storage S3',
      });
  });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '../../.env'), '.env'],
      validate: (config) => envSchema.parse(config),
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
