import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewDto } from './engagements.dto';

@Injectable()
export class EngagementsService {
  constructor(private readonly prisma: PrismaService) {}
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
    return this.prisma.review.upsert({
      where: { userId_saasId: { userId, saasId } },
      create: { userId, saasId, rating: dto.rating, comment: dto.comment },
      update: { rating: dto.rating, comment: dto.comment, hidden: false },
    });
  }
  async updateReview(userId: string, id: string, dto: ReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review não encontrada');
    if (review.userId !== userId) throw new ForbiddenException();
    return this.prisma.review.update({ where: { id }, data: dto });
  }
  async deleteReview(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException();
    if (review.userId !== userId) throw new ForbiddenException();
    await this.prisma.review.delete({ where: { id } });
  }
  async favorite(userId: string, saasId: string) {
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
}
