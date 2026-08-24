import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { SaasService } from './saas.service';
import { TrendingService } from './trending.service';

describe('SaasService public responses', () => {
  const findMany = jest.fn().mockResolvedValue([]);
  const findFirst = jest.fn().mockResolvedValue(null);
  const count = jest.fn().mockResolvedValue(0);
  const prisma = {
    saas: { findMany, findFirst, count },
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
  } as unknown as PrismaService;
  const moderation = {
    assertAllowed: jest.fn(),
  } as unknown as ModerationService;
  const service = new SaasService(prisma, new TrendingService(), moderation);

  beforeEach(() => jest.clearAllMocks());

  it('seleciona explicitamente os campos da listagem pública', async () => {
    await service.listPublic({
      sort: 'recent',
      page: 1,
      pageSize: 12,
    });

    const calls = findMany.mock.calls as unknown as Array<
      [{ select: Record<string, unknown> }]
    >;
    const select = calls[0]?.[0].select;
    expect(select).toBeDefined();
    expect(select.ownerId).toBeUndefined();
    expect(select.rejectionReason).toBeUndefined();
    expect(select.createdAt).toBeUndefined();
  });

  it('não seleciona campos internos nas avaliações públicas', async () => {
    await expect(service.getPublic('produto')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const calls = findFirst.mock.calls as unknown as Array<
      [
        {
          select: { reviews?: { select?: Record<string, unknown> } };
        },
      ]
    >;
    const select = calls[0]?.[0].select;
    expect(select.reviews?.select?.spam).toBeUndefined();
    expect(select.reviews?.select?.spamTerms).toBeUndefined();
    expect(select.reviews?.select?.userId).toBeUndefined();
  });
});
