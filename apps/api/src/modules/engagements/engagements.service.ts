import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { ReviewDto } from './engagements.dto';

@Injectable()
export class EngagementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moderation: ModerationService,
  ) {}
  listReviews(saasId: string) {
    return this.prisma.review.findMany({
      where: { saasId, hidden: false },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
  async review(userId: string, saasId: string, dto: ReviewDto) {
    if (process.env.REVIEWS_ENABLED === 'false')
      throw new BadRequestException('Reviews estão desativadas');
    const saas = await this.prisma.saas.findUnique({ where: { id: saasId } });
    if (!saas || saas.status !== 'PUBLISHED')
      throw new NotFoundException('SaaS não encontrado');
    if (saas.ownerId === userId)
      throw new ForbiddenException('Você não pode avaliar o próprio produto');
    const moderation = this.moderation.scan([dto.comment]);
    const reviewData = {
      rating: dto.rating,
      comment: dto.comment,
      hidden: moderation.blocked,
      spam: moderation.blocked,
      spamTerms: moderation.terms,
    };
    return this.prisma.review.upsert({
      where: { userId_saasId: { userId, saasId } },
      create: { userId, saasId, ...reviewData },
      update: reviewData,
    });
  }
  async updateReview(userId: string, id: string, dto: ReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review não encontrada');
    if (review.userId !== userId) throw new ForbiddenException();
    const moderation = this.moderation.scan([dto.comment]);
    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        comment: dto.comment,
        hidden: moderation.blocked,
        spam: moderation.blocked,
        spamTerms: moderation.terms,
      },
    });
  }
  async deleteReview(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException();
    if (review.userId !== userId) throw new ForbiddenException();
    await this.prisma.review.delete({ where: { id } });
  }
  async favorite(userId: string, saasId: string) {
    await this.assertPublishedEngageable(userId, saasId, {
      allowOwner: true,
      notFoundMessage: 'SaaS não encontrado',
    });
    await this.prisma.favorite.upsert({
      where: { userId_saasId: { userId, saasId } },
      create: { userId, saasId },
      update: {},
    });
    await this.prisma.analyticsEvent.create({
      data: { saasId, type: 'FAVORITE' },
    });
    return { favorited: true };
  }
  async unfavorite(userId: string, saasId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, saasId } });
    return { favorited: false };
  }
  async boost(userId: string, saasId: string) {
    await this.assertPublishedEngageable(userId, saasId, {
      allowOwner: false,
      notFoundMessage: 'SaaS não encontrado',
    });
    await this.prisma.saasBoost.upsert({
      where: { userId_saasId: { userId, saasId } },
      create: { userId, saasId },
      update: {},
    });
    const boosts = await this.prisma.saasBoost.count({ where: { saasId } });
    return { boosted: true, boosts };
  }
  async boostStatus(userId: string, saasId: string) {
    await this.assertPublishedEngageable(userId, saasId, {
      allowOwner: true,
      notFoundMessage: 'SaaS não encontrado',
    });
    const boost = await this.prisma.saasBoost.findUnique({
      where: { userId_saasId: { userId, saasId } },
      select: { userId: true },
    });
    const boosts = await this.prisma.saasBoost.count({ where: { saasId } });
    return { boosted: Boolean(boost), boosts };
  }
  favorites(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        saas: {
          include: {
            categories: { include: { category: true } },
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async assertPublishedEngageable(
    userId: string,
    saasId: string,
    options: { allowOwner: boolean; notFoundMessage: string },
  ) {
    const saas = await this.prisma.saas.findUnique({
      where: { id: saasId },
      select: { ownerId: true, status: true },
    });
    if (!saas || saas.status !== 'PUBLISHED')
      throw new NotFoundException(options.notFoundMessage);
    if (!options.allowOwner && saas.ownerId === userId)
      throw new ForbiddenException(
        'Você não pode impulsionar o próprio produto',
      );
  }
}
