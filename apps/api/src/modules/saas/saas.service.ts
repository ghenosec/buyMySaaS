import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SaasStatus } from '@prisma/client';
import { assertOwnership } from '../../common/ownership';
import { assertSafeExternalUrl } from '../../common/safe-url';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaasDto, ExploreQueryDto, UpdateSaasDto } from './saas.dto';
import { TrendingService } from './trending.service';

const publicInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  categories: { include: { category: true } },
  screenshots: { orderBy: { position: 'asc' as const } },
  reviews: { where: { hidden: false }, select: { rating: true } },
  _count: { select: { favorites: true, analyticsEvents: true, reviews: true } },
};

@Injectable()
export class SaasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trending: TrendingService,
  ) {}

  async create(ownerId: string, dto: CreateSaasDto) {
    const slug = await this.uniqueSlug(dto.slug ?? dto.name);
    const urls = this.validatedUrls(dto);
    return this.prisma.saas.create({
      data: {
        ownerId,
        name: dto.name.trim(),
        slug,
        tagline: dto.tagline.trim(),
        shortDescription: dto.shortDescription.trim(),
        description: dto.description.trim(),
        websiteUrl: assertSafeExternalUrl(dto.websiteUrl),
        logoUrl: dto.logoUrl,
        accentColor: dto.accentColor,
        countryCode: dto.countryCode.toUpperCase(),
        language: dto.language,
        isBrazilian: dto.isBrazilian ?? dto.countryCode.toUpperCase() === 'BR',
        pricingType: dto.pricingType,
        priceCents: dto.priceCents,
        currency: dto.currency.toUpperCase(),
        billingInterval: dto.billingInterval,
        pricingLabel: dto.pricingLabel,
        tags: this.cleanList(dto.tags),
        technologies: this.cleanList(dto.technologies),
        ...urls,
        categories: {
          create: dto.categoryIds.map((categoryId) => ({ categoryId })),
        },
        screenshots: {
          create: (dto.screenshotUrls ?? []).map((url, position) => ({
            url: assertSafeExternalUrl(url),
            alt: `Screenshot de ${dto.name}`,
            position,
          })),
        },
      },
      include: publicInclude,
    });
  }

  async update(ownerId: string, id: string, dto: UpdateSaasDto) {
    const current = await this.prisma.saas.findUnique({ where: { id } });
    assertOwnership(current, ownerId);
    const urls = this.validatedUrls(dto);
    const data: Prisma.SaasUpdateInput = { ...urls };
    for (const key of [
      'name',
      'tagline',
      'shortDescription',
      'description',
      'logoUrl',
      'accentColor',
      'language',
      'pricingLabel',
    ] as const)
      if (dto[key] !== undefined) data[key] = dto[key];
    if (dto.countryCode !== undefined) {
      data.countryCode = dto.countryCode.toUpperCase();
      data.isBrazilian =
        dto.isBrazilian ?? dto.countryCode.toUpperCase() === 'BR';
    }
    if (dto.pricingType !== undefined) data.pricingType = dto.pricingType;
    if (dto.priceCents !== undefined) data.priceCents = dto.priceCents;
    if (dto.currency !== undefined) data.currency = dto.currency.toUpperCase();
    if (dto.billingInterval !== undefined)
      data.billingInterval = dto.billingInterval;
    if (dto.tags !== undefined) data.tags = this.cleanList(dto.tags);
    if (dto.technologies !== undefined)
      data.technologies = this.cleanList(dto.technologies);
    if (dto.slug !== undefined && dto.slug !== current.slug)
      data.slug = await this.uniqueSlug(dto.slug, id);
    if (current.status === 'PUBLISHED')
      await this.prisma.auditLog.create({
        data: {
          actorUserId: ownerId,
          action: 'PUBLISHED_SAAS_UPDATED',
          entityType: 'Saas',
          entityId: id,
          metadata: { fields: Object.keys(dto) },
        },
      });
    return this.prisma.$transaction(async (tx) => {
      if (dto.categoryIds) {
        await tx.saasCategory.deleteMany({ where: { saasId: id } });
        data.categories = {
          create: dto.categoryIds.map((categoryId) => ({ categoryId })),
        };
      }
      if (dto.screenshotUrls) {
        await tx.saasScreenshot.deleteMany({ where: { saasId: id } });
        data.screenshots = {
          create: dto.screenshotUrls.map((url, position) => ({
            url: assertSafeExternalUrl(url),
            alt: `Screenshot de ${dto.name ?? current.name}`,
            position,
          })),
        };
      }
      return tx.saas.update({ where: { id }, data, include: publicInclude });
    });
  }

  async listPublic(query: ExploreQueryDto) {
    const where: Prisma.SaasWhereInput = { status: 'PUBLISHED' };
    if (query.search)
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { tagline: { contains: query.search, mode: 'insensitive' } },
        { shortDescription: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.toLowerCase() } },
      ];
    if (query.category)
      where.categories = { some: { category: { slug: query.category } } };
    if (query.pricingType) where.pricingType = query.pricingType;
    if (query.free) where.pricingType = 'FREE';
    if (query.trial) where.trialUrl = { not: null };
    if (query.brazilian) where.isBrazilian = true;
    if (query.minPrice !== undefined || query.maxPrice !== undefined)
      where.priceCents = { gte: query.minPrice, lte: query.maxPrice };
    const orderBy: Prisma.SaasOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { priceCents: 'asc' }
        : query.sort === 'price_desc'
          ? { priceCents: 'desc' }
          : { publishedAt: 'desc' };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.saas.findMany({
        where,
        include: publicInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.saas.count({ where }),
    ]);
    const enriched = data.map((saas) => ({
      ...saas,
      averageRating: this.average(saas.reviews),
      score: this.trending.score({
        views: saas._count.analyticsEvents,
        clicks: 0,
        favorites: saas._count.favorites,
        reviews: saas._count.reviews,
        newestEventAt: saas.publishedAt,
      }),
    }));
    if (query.sort === 'trending') enriched.sort((a, b) => b.score - a.score);
    if (query.sort === 'rating')
      enriched.sort((a, b) => b.averageRating - a.averageRating);
    return {
      data: enriched,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async getPublic(slug: string) {
    const saas = await this.prisma.saas.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        ...publicInclude,
        reviews: {
          where: { hidden: false },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!saas) throw new NotFoundException('SaaS não encontrado');
    return { ...saas, averageRating: this.average(saas.reviews) };
  }

  async mine(ownerId: string) {
    return this.prisma.saas.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      include: {
        categories: { include: { category: true } },
        _count: { select: { analyticsEvents: true, favorites: true } },
      },
    });
  }
  async mineOne(ownerId: string, id: string) {
    const item = await this.prisma.saas.findUnique({
      where: { id },
      include: publicInclude,
    });
    assertOwnership(item, ownerId);
    return item;
  }
  async archive(ownerId: string, id: string) {
    const item = await this.prisma.saas.findUnique({ where: { id } });
    assertOwnership(item, ownerId);
    return this.prisma.saas.update({
      where: { id },
      data: { status: SaasStatus.ARCHIVED },
    });
  }

  private validatedUrls(dto: Partial<CreateSaasDto>) {
    const out: Record<string, string> = {};
    for (const key of [
      'websiteUrl',
      'trialUrl',
      'checkoutUrl',
      'docsUrl',
      'demoUrl',
    ] as const) {
      const value = dto[key];
      if (value) out[key] = assertSafeExternalUrl(value);
    }
    return out;
  }
  private cleanList(values: string[]) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }
  private average(reviews: { rating: number }[]) {
    return reviews.length
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          ).toFixed(1),
        )
      : 0;
  }
  private async uniqueSlug(input: string, ignoreId?: string) {
    const base =
      input
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 70) || 'saas';
    let slug = base;
    let counter = 2;
    while (
      await this.prisma.saas.findFirst({
        where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
        select: { id: true },
      })
    )
      slug = `${base}-${counter++}`;
    return slug;
  }
}
