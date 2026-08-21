import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationStateService } from '../saas/publication-state.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly states: PublicationStateService,
  ) {}
  async dashboard() {
    const [pending, published, users, recentSubmissions, recentPayments] =
      await this.prisma.$transaction([
        this.prisma.saas.count({ where: { status: 'PENDING_REVIEW' } }),
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
        this.prisma.publicationOrder.findMany({
          take: 6,
          orderBy: { updatedAt: 'desc' },
          include: {
            saas: { select: { name: true } },
            user: { select: { email: true } },
          },
        }),
      ]);
    return { pending, published, users, recentSubmissions, recentPayments };
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
          orders: { orderBy: { createdAt: 'desc' } },
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
      select: { id: true, name: true, slug: true, status: true, ownerId: true },
    });
    if (!item) throw new NotFoundException();
    await this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: 'SAAS_DELETED',
          entityType: 'Saas',
          entityId: id,
          metadata: item,
        },
      });
      await tx.saas.delete({ where: { id } });
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
    if (!review || review.saas.status !== 'PUBLISHED' || !review.spam)
      throw new NotFoundException('Avaliação não encontrada');
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
