import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ReviewModerationStatus,
  UserRole,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationStateService } from '../saas/publication-state.service';
import { StorageService } from '../storage/storage.service';
import { ReviewModerationQueryDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly states: PublicationStateService,
    private readonly storage: StorageService,
  ) {}
  async dashboard() {
    const [pending, pendingReviews, published, users, recentSubmissions] =
      await this.prisma.$transaction([
        this.prisma.saas.count({ where: { status: 'PENDING_REVIEW' } }),
        this.prisma.review.count({
          where: { moderationStatus: 'PENDING' },
        }),
        this.prisma.saas.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.user.count(),
        this.prisma.saas.findMany({
          where: {
            status: { in: ['PENDING_REVIEW', 'PUBLISHED', 'REJECTED'] },
          },
          take: 6,
          orderBy: { updatedAt: 'desc' },
          include: { owner: { select: { name: true, email: true } } },
        }),
      ]);
    return {
      pending,
      pendingReviews,
      published,
      users,
      recentSubmissions,
    };
  }
  submissions(page = 1) {
    return this.prisma.saas.findMany({
      where: { status: { in: ['PENDING_REVIEW', 'PUBLISHED', 'REJECTED'] } },
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { updatedAt: 'asc' },
      include: {
        owner: { select: { name: true, email: true } },
        categories: { include: { category: true } },
      },
    });
  }
  async submission(id: string) {
    const [item, spamReviews] = await this.prisma.$transaction([
      this.prisma.saas.findUnique({
        where: { id },
        include: {
          owner: { select: { name: true, email: true } },
          categories: { include: { category: true } },
          screenshots: true,
          reviews: {
            where: { hidden: false },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.review.findMany({
        where: { saasId: id, spam: true },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    if (!item) throw new NotFoundException();
    return { ...item, spamReviews };
  }
  users(search?: string) {
    const term = search?.trim();
    const where: Prisma.UserWhereInput = term
      ? {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {};
    return this.prisma.user.findMany({
      where,
      take: 100,
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { saas: true, reviews: true } },
      },
    });
  }
  async updateUserRole(
    actorUserId: string,
    targetUserId: string,
    role: UserRole,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!target) throw new NotFoundException('Usuário não encontrado');
    if (actorUserId === targetUserId && role !== UserRole.ADMIN)
      throw new ForbiddenException(
        'Você não pode remover sua própria permissão de administrador',
      );
    if (target.role === role) return target;
    return this.prisma.$transaction(async (tx) => {
      if (target.role === UserRole.ADMIN && role === UserRole.USER) {
        const adminCount = await tx.user.count({
          where: { role: UserRole.ADMIN },
        });
        if (adminCount <= 1)
          throw new BadRequestException(
            'Mantenha pelo menos um administrador ativo',
          );
      }
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      });
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'USER_ROLE_UPDATED',
          entityType: 'User',
          entityId: targetUserId,
          metadata: {
            targetEmail: target.email,
            previousRole: target.role,
            nextRole: role,
          },
        },
      });
      return updated;
    });
  }
  async approve(actorUserId: string, id: string) {
    const item = await this.prisma.saas.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    this.states.assertCanModerate(item.status);
    return this.prisma.$transaction(async (tx) => {
      const saas = await tx.saas.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: item.publishedAt ?? new Date(),
          rejectionReason: null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'SAAS_APPROVED',
          entityType: 'Saas',
          entityId: id,
        },
      });
      return saas;
    });
  }
  async reject(actorUserId: string, id: string, reason: string) {
    const item = await this.prisma.saas.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    this.states.assertCanModerate(item.status);
    return this.prisma.$transaction(async (tx) => {
      const saas = await tx.saas.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: reason },
      });
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'SAAS_REJECTED',
          entityType: 'Saas',
          entityId: id,
          metadata: { reason },
        },
      });
      return saas;
    });
  }
  async remove(actorUserId: string, id: string) {
    const item = await this.prisma.saas.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        ownerId: true,
        logoUrl: true,
        screenshots: { select: { url: true } },
      },
    });
    if (!item) throw new NotFoundException();
    const { logoUrl, screenshots, ...auditMetadata } = item;
    await this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'SAAS_DELETED',
          entityType: 'Saas',
          entityId: id,
          metadata: auditMetadata,
        },
      });
      await tx.saas.delete({ where: { id } });
    });
    await this.storage.deleteManagedUrls([
      logoUrl,
      ...screenshots.map((screenshot) => screenshot.url),
    ]);
  }

  async reviews(query: ReviewModerationQueryDto) {
    const term = query.search?.trim();
    const where: Prisma.ReviewWhereInput = {
      moderationStatus: query.status ?? ReviewModerationStatus.PENDING,
      ...(term
        ? {
            OR: [
              { comment: { contains: term, mode: 'insensitive' as const } },
              {
                user: {
                  is: {
                    OR: [
                      {
                        name: { contains: term, mode: 'insensitive' as const },
                      },
                      {
                        email: {
                          contains: term,
                          mode: 'insensitive' as const,
                        },
                      },
                    ],
                  },
                },
              },
              {
                saas: {
                  is: {
                    name: { contains: term, mode: 'insensitive' as const },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          saas: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async approveReview(actorUserId: string, id: string) {
    return this.moderateReview(actorUserId, id, 'APPROVED');
  }

  async rejectReview(actorUserId: string, id: string, reason: string) {
    return this.moderateReview(actorUserId, id, 'REJECTED', reason);
  }

  private async moderateReview(
    actorUserId: string,
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reason?: string,
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      select: { id: true, moderationStatus: true, saasId: true, userId: true },
    });
    if (!review) throw new NotFoundException('Avaliação não encontrada');
    if (review.moderationStatus !== 'PENDING')
      throw new BadRequestException('Esta avaliação já foi moderada');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          moderationStatus: status,
          hidden: status !== 'APPROVED',
          spam: status === 'APPROVED' ? false : undefined,
          moderationReason: reason ?? null,
          moderatedAt: new Date(),
          moderatedById: actorUserId,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: `REVIEW_${status}`,
          entityType: 'Review',
          entityId: id,
          metadata: {
            saasId: review.saasId,
            userId: review.userId,
            reason,
          },
        },
      });
      return updated;
    });
  }

  async removeReview(actorUserId: string, id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        saas: { select: { id: true, name: true, slug: true, status: true } },
        user: { select: { id: true, email: true } },
      },
    });
    if (!review) throw new NotFoundException('Avaliação não encontrada');
    await this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'REVIEW_DELETED',
          entityType: 'Review',
          entityId: id,
          metadata: {
            saasId: review.saas.id,
            saasName: review.saas.name,
            saasSlug: review.saas.slug,
            userId: review.user.id,
            userEmail: review.user.email,
            rating: review.rating,
            spamTerms: review.spamTerms,
          },
        },
      });
      await tx.review.delete({ where: { id } });
    });
  }
}
