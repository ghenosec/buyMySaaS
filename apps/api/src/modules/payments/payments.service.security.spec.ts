import { BadRequestException, ForbiddenException } from '@nestjs/common';
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

describe('PaymentsService sponsored placements', () => {
  const originalEnv = {
    nodeEnv: process.env.NODE_ENV,
    provider: process.env.PAYMENT_PROVIDER,
    webUrl: process.env.WEB_URL,
    enabled: process.env.SPONSORED_PLACEMENT_ENABLED,
    price: process.env.SPONSORED_PLACEMENT_PRICE_CENTS,
    days: process.env.SPONSORED_PLACEMENT_DURATION_DAYS,
  };

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    process.env.PAYMENT_PROVIDER = 'mock';
    process.env.WEB_URL = 'http://localhost:3000';
    process.env.SPONSORED_PLACEMENT_ENABLED = 'true';
    process.env.SPONSORED_PLACEMENT_PRICE_CENTS = '2990';
    process.env.SPONSORED_PLACEMENT_DURATION_DAYS = '7';
  });

  afterEach(() => {
    restoreEnvironment('NODE_ENV', originalEnv.nodeEnv);
    restoreEnvironment('PAYMENT_PROVIDER', originalEnv.provider);
    restoreEnvironment('WEB_URL', originalEnv.webUrl);
    restoreEnvironment('SPONSORED_PLACEMENT_ENABLED', originalEnv.enabled);
    restoreEnvironment('SPONSORED_PLACEMENT_PRICE_CENTS', originalEnv.price);
    restoreEnvironment('SPONSORED_PLACEMENT_DURATION_DAYS', originalEnv.days);
    jest.restoreAllMocks();
  });

  it('cria checkout de destaque para SaaS publicado', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'order-1',
      checkoutUrl: null,
    });
    const update = jest.fn().mockResolvedValue({
      id: 'order-1',
      checkoutUrl:
        'http://localhost:3000/dashboard/saas/saas-1/review?order=order-1',
    });
    const prisma = {
      saas: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'saas-1',
          ownerId: 'user-1',
          name: 'Produto',
          status: 'PUBLISHED',
        }),
      },
      publicationOrder: {
        findFirst: jest.fn().mockResolvedValue(null),
        create,
        update,
      },
    } as unknown as PrismaService;
    const service = new PaymentsService(
      prisma,
      {} as PublicationStateService,
      {} as ModerationService,
      new MockPaymentProvider(),
      {} as MercadoPagoPaymentProvider,
    );

    const result = await service.createSponsorshipCheckout('user-1', 'saas-1');

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        saasId: 'saas-1',
        type: 'SPONSORED_PLACEMENT',
        provider: 'MOCK',
        amountCents: 2990,
        currency: 'BRL',
        entitlementDays: 7,
        status: 'PENDING',
      },
    });
    expect(result.checkoutUrl).toContain('order=order-1');
  });

  it('bloqueia destaque antes da publicação', async () => {
    const prisma = {
      saas: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'saas-1',
          ownerId: 'user-1',
          name: 'Produto',
          status: 'PENDING_REVIEW',
        }),
      },
    } as unknown as PrismaService;
    const service = new PaymentsService(
      prisma,
      {} as PublicationStateService,
      {} as ModerationService,
      new MockPaymentProvider(),
      {} as MercadoPagoPaymentProvider,
    );

    await expect(
      service.createSponsorshipCheckout('user-1', 'saas-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('ativa o destaque ao confirmar pagamento', async () => {
    const saasUpdate = jest.fn();
    const sponsorshipCreate = jest.fn();
    const tx = {
      publicationOrder: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'order-1',
          userId: 'user-1',
          saasId: 'saas-1',
          provider: 'MOCK',
          type: 'SPONSORED_PLACEMENT',
          status: 'PENDING',
          entitlementDays: 7,
        }),
        update: jest.fn().mockResolvedValue({ id: 'order-1', status: 'PAID' }),
      },
      saas: {
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ sponsoredUntil: new Date('2030-01-10') }),
        update: saasUpdate,
      },
      saasSponsorship: { create: sponsorshipCreate },
      auditLog: { create: jest.fn() },
    };
    const prisma = {
      publicationOrder: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          userId: 'user-1',
          saasId: 'saas-1',
          provider: 'MOCK',
          providerPaymentId: 'mock_order-1',
          saas: { id: 'saas-1', ownerId: 'user-1' },
        }),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as unknown as PrismaService;
    const service = new PaymentsService(
      prisma,
      {} as PublicationStateService,
      {} as ModerationService,
      new MockPaymentProvider(),
      {} as MercadoPagoPaymentProvider,
    );

    await service.confirmMock('user-1', 'order-1');

    expect(saasUpdate).toHaveBeenCalledWith({
      where: { id: 'saas-1' },
      data: { sponsoredUntil: new Date('2030-01-17') },
    });
    expect(sponsorshipCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        saasId: 'saas-1',
        orderId: 'order-1',
        startsAt: new Date('2030-01-10'),
        endsAt: new Date('2030-01-17'),
      },
    });
  });
});

function restoreEnvironment(name: string, value?: string) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
