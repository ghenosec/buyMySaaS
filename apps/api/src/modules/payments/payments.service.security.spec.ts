import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { PublicationStateService } from '../saas/publication-state.service';
import { MercadoPagoPaymentProvider } from './mercado-pago.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaymentsService } from './payments.service';

describe('PaymentsService production hardening', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalProvider = process.env.PAYMENT_PROVIDER;
  const service = new PaymentsService(
    {} as PrismaService,
    {} as PublicationStateService,
    {} as ModerationService,
    {} as MockPaymentProvider,
    {} as MercadoPagoPaymentProvider,
  );

  afterEach(() => {
    restoreEnvironment('NODE_ENV', originalNodeEnv);
    restoreEnvironment('PAYMENT_PROVIDER', originalProvider);
  });

  it('bloqueia confirmação mock em produção', async () => {
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_PROVIDER = 'mock';

    await expect(
      service.confirmMock('user-1', 'order-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

function restoreEnvironment(name: string, value?: string) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
