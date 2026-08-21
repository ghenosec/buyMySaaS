import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SaasStatus } from '../../generated/prisma/client';
import { assertOwnership } from '../../common/ownership';
import { assertSafeExternalUrl } from '../../common/safe-url';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateSaasDto, ExploreQueryDto, UpdateSaasDto } from './saas.dto';
import { TrendingService, type TrendSignals } from './trending.service';

const publicInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  categories: { include: { category: true } },
  screenshots: { orderBy: { position: 'asc' as const } },
  reviews: { where: { hidden: false }, select: { rating: true } },
  _count: {
    select: {
      favorites: true,
      boosts: true,
      analyticsEvents: true,
      reviews: { where: { hidden: false } },
    },
  },
};

@Injectable()
export class SaasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly trending: TrendingService,
    private readonly moderation: ModerationService,
  ) {}

  async create(ownerId: string, dto: CreateSaasDto) {
    this.assertSaasContentAllowed(dto);
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
        logoUrl: dto.logoUrl ? assertSafeExternalUrl(dto.logoUrl) : undefined,
        accentColor: dto.accentColor,
        countryCode: dto.countryCode.toUpperCase(),
        language: dto.language,
        isBrazilian: dto.isBrazilian ?? dto.countryCode.toUpperCase() === 'BR',
        isAdult: dto.isAdult ?? false,
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
    this.assertSaasContentAllowed(dto);
    const urls = this.validatedUrls(dto);
    const data: Prisma.SaasUpdateInput = { ...urls };
    for (const key of [
      'name',
      'tagline',
      'shortDescription',
      'description',
      'accentColor',
      'language',
      'pricingLabel',
    ] as const)
      if (dto[key] !== undefined) data[key] = dto[key];
    if (dto.logoUrl !== undefined)
      data.logoUrl = dto.logoUrl ? assertSafeExternalUrl(dto.logoUrl) : null;
    if (dto.countryCode !== undefined) {
      data.countryCode = dto.countryCode.toUpperCase();
      data.isBrazilian =
        dto.isBrazilian ?? dto.countryCode.toUpperCase() === 'BR';
    }
    if (dto.isAdult !== undefined) data.isAdult = dto.isAdult;
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
    where.isAdult =
      query.adult || query.category === 'adulto-18' ? true : false;
    if (query.minPrice !== undefined || query.maxPrice !== undefined)
      where.priceCents = { gte: query.minPrice, lte: query.maxPrice };
    if (query.sort === 'trending') return this.listTrendingPublic(where, query);
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
        boosts: saas._count.boosts,
        reviews: saas._count.reviews,
        newestEventAt: saas.publishedAt,
      }),
    }));
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
  private assertSaasContentAllowed(dto: Partial<CreateSaasDto>) {
    this.moderation.assertAllowed([
      dto.name,
      dto.slug,
      dto.tagline,
      dto.shortDescription,
      dto.description,
      dto.websiteUrl,
      dto.trialUrl,
      dto.checkoutUrl,
      dto.docsUrl,
      dto.demoUrl,
      dto.pricingLabel,
      dto.tags,
      dto.technologies,
    ]);
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

  private async listTrendingPublic(
    where: Prisma.SaasWhereInput,
    query: ExploreQueryDto,
  ) {
    const since = new Date(
      Date.now() - this.trending.windowDays * 24 * 60 * 60 * 1000,
    );
    const candidateIds = await this.trendingCandidateIds(where, since);
    if (!candidateIds.length)
      return {
        data: [],
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 0,
        },
      };
    const scopedWhere: Prisma.SaasWhereInput = {
      AND: [where, { id: { in: candidateIds } }],
    };
    const data = await this.prisma.saas.findMany({
      where: scopedWhere,
      include: publicInclude,
      orderBy: { publishedAt: 'desc' },
    });
    const signals = await this.recentTrendSignals(
      data.map((saas) => saas.id),
      since,
    );
    const enriched = data
      .map((saas) => ({
        ...saas,
        averageRating: this.average(saas.reviews),
        score: this.trending.score({
          ...this.emptySignals(saas.publishedAt),
          ...signals.get(saas.id),
          newestEventAt:
            signals.get(saas.id)?.newestEventAt ?? saas.publishedAt,
        }),
      }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const start = (query.page - 1) * query.pageSize;
    return {
      data: enriched.slice(start, start + query.pageSize),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: enriched.length,
        totalPages: Math.ceil(enriched.length / query.pageSize),
      },
    };
  }

  private async trendingCandidateIds(
    where: Prisma.SaasWhereInput,
    since: Date,
  ) {
    const [recent, analytics, favorites, boosts, reviews] =
      await this.prisma.$transaction([
        this.prisma.saas.findMany({
          where,
          select: { id: true },
          orderBy: { publishedAt: 'desc' },
          take: 120,
        }),
        this.prisma.analyticsEvent.groupBy({
          by: ['saasId'],
          where: { createdAt: { gte: since } },
          orderBy: { saasId: 'asc' },
        }),
        this.prisma.favorite.groupBy({
          by: ['saasId'],
          where: { createdAt: { gte: since } },
          orderBy: { saasId: 'asc' },
        }),
        this.prisma.saasBoost.groupBy({
          by: ['saasId'],
          where: { createdAt: { gte: since } },
          orderBy: { saasId: 'asc' },
        }),
        this.prisma.review.groupBy({
          by: ['saasId'],
          where: { createdAt: { gte: since }, hidden: false },
          orderBy: { saasId: 'asc' },
        }),
      ]);
    return [
      ...new Set([
        ...recent.map((item) => item.id),
        ...analytics.map((item) => item.saasId),
        ...favorites.map((item) => item.saasId),
        ...boosts.map((item) => item.saasId),
        ...reviews.map((item) => item.saasId),
      ]),
    ];
  }

  private async recentTrendSignals(saasIds: string[], since: Date) {
    const map = new Map<string, TrendSignals>();
    if (!saasIds.length) return map;
    const [events, favorites, boosts, reviews] = await this.prisma.$transaction(
      [
        this.prisma.analyticsEvent.groupBy({
          by: ['saasId', 'type'],
          where: { saasId: { in: saasIds }, createdAt: { gte: since } },
          orderBy: [{ saasId: 'asc' }, { type: 'asc' }],
          _count: { _all: true },
          _max: { createdAt: true },
        }),
        this.prisma.favorite.groupBy({
          by: ['saasId'],
          where: { saasId: { in: saasIds }, createdAt: { gte: since } },
          orderBy: { saasId: 'asc' },
          _count: { _all: true },
          _max: { createdAt: true },
        }),
        this.prisma.saasBoost.groupBy({
          by: ['saasId'],
          where: { saasId: { in: saasIds }, createdAt: { gte: since } },
          orderBy: { saasId: 'asc' },
          _count: { _all: true },
          _max: { createdAt: true },
        }),
        this.prisma.review.groupBy({
          by: ['saasId'],
          where: {
            saasId: { in: saasIds },
            createdAt: { gte: since },
            hidden: false,
          },
          orderBy: { saasId: 'asc' },
          _count: { _all: true },
          _max: { createdAt: true },
        }),
      ],
    );
    const get = (saasId: string) => {
      const signals = map.get(saasId) ?? this.emptySignals();
      map.set(saasId, signals);
      return signals;
    };
    for (const event of events) {
      const signals = get(event.saasId);
      if (event.type === 'PAGE_VIEW')
        signals.views += this.countAll(event._count);
      if (event.type.endsWith('CLICK'))
        signals.clicks += this.countAll(event._count);
      signals.newestEventAt = this.newestDate(
        signals.newestEventAt,
        event._max?.createdAt,
      );
    }
    for (const favorite of favorites) {
      const signals = get(favorite.saasId);
      signals.favorites += this.countAll(favorite._count);
      signals.newestEventAt = this.newestDate(
        signals.newestEventAt,
        favorite._max?.createdAt,
      );
    }
    for (const boost of boosts) {
      const signals = get(boost.saasId);
      signals.boosts += this.countAll(boost._count);
      signals.newestEventAt = this.newestDate(
        signals.newestEventAt,
        boost._max?.createdAt,
      );
    }
    for (const review of reviews) {
      const signals = get(review.saasId);
      signals.reviews += this.countAll(review._count);
      signals.newestEventAt = this.newestDate(
        signals.newestEventAt,
        review._max?.createdAt,
      );
    }
    return map;
  }

  private emptySignals(newestEventAt: Date | null = null): TrendSignals {
    return {
      views: 0,
      clicks: 0,
      favorites: 0,
      boosts: 0,
      reviews: 0,
      newestEventAt,
    };
  }

  private newestDate(a?: Date | null, b?: Date | null) {
    if (!a) return b ?? null;
    if (!b) return a;
    return a > b ? a : b;
  }

  private countAll(value?: boolean | { _all?: number | null }) {
    return typeof value === 'object' ? (value._all ?? 0) : 0;
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
