/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { EngagementsService } from './engagements.service';

describe('EngagementsService review moderation', () => {
  it('retém toda avaliação nova na fila dedicada', async () => {
    const upsert = jest.fn().mockResolvedValue({
      id: 'review-1',
      moderationStatus: 'PENDING',
    });
    const prisma = {
      saas: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'saas-1',
          ownerId: 'owner-1',
          status: 'PUBLISHED',
        }),
      },
      review: { upsert },
    } as unknown as PrismaService;
    const moderation = {
      scan: jest.fn().mockReturnValue({ blocked: false, terms: [] }),
    } as unknown as ModerationService;
    const service = new EngagementsService(prisma, moderation);

    await service.review('user-1', 'saas-1', {
      rating: 5,
      comment: '  Produto excelente  ',
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          hidden: true,
          moderationStatus: 'PENDING',
          comment: 'Produto excelente',
        }),
      }),
    );
  });
});
