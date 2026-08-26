import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { SaasService } from './saas.service';
import { PublicationStateService } from './publication-state.service';
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
  const service = new SaasService(
    prisma,
    new TrendingService(),
    moderation,
    new PublicationStateService(),
  );

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

describe('SaasService free publication', () => {
  it('envia o produto diretamente para moderação', async () => {
    const update = jest.fn().mockResolvedValue({ status: 'PENDING_REVIEW' });
    const prisma = {
      saas: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'saas-1',
          ownerId: 'user-1',
          status: 'DRAFT',
          name: 'Produto',
          slug: 'produto',
          tagline: 'Uma tagline',
          shortDescription: 'Uma descrição curta suficiente',
          description: 'Uma descrição completa suficiente para moderação.',
          websiteUrl: 'https://example.com',
          trialUrl: null,
          docsUrl: null,
          demoUrl: null,
          pricingLabel: null,
          tags: [],
          technologies: [],
        }),
        update,
      },
    } as unknown as PrismaService;
    const moderation = {
      assertAllowed: jest.fn(),
    } as unknown as ModerationService;
    const service = new SaasService(
      prisma,
      new TrendingService(),
      moderation,
      new PublicationStateService(),
    );

    await expect(service.submit('user-1', 'saas-1')).resolves.toEqual({
      status: 'PENDING_REVIEW',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'saas-1' },
      data: { status: 'PENDING_REVIEW', rejectionReason: null },
    });
  });
});
