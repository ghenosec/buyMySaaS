import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SaasStatus } from '../../generated/prisma/client';
import { assertOwnership } from '../../common/ownership';
import { assertSafeExternalUrl } from '../../common/safe-url';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateSaasDto, ExploreQueryDto, UpdateSaasDto } from './saas.dto';
import { TrendingService, type TrendSignals } from './trending.service';

const privateInclude = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  categories: { include: { category: true } },
  screenshots: { orderBy: { position: 'asc' as const } },
  reviews: {
    where: { hidden: false, moderationStatus: 'APPROVED' as const },
    select: { rating: true },
  },
  _count: {
    select: {
      favorites: true,
      boosts: true,
      analyticsEvents: true,
      reviews: {
        where: { hidden: false, moderationStatus: 'APPROVED' as const },
      },
    },
  },
};

const publicSaasFields = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  shortDescription: true,
  description: true,
  logoUrl: true,
  accentColor: true,
  countryCode: true,
  language: true,
  websiteUrl: true,
  trialUrl: true,
  checkoutUrl: true,
  docsUrl: true,
  demoUrl: true,
  pricingType: true,
  priceCents: true,
  currency: true,
  billingInterval: true,
  pricingLabel: true,
  isBrazilian: true,
  isAdult: true,
  tags: true,
  technologies: true,
  status: true,
  publishedAt: true,
  sponsoredUntil: true,
  updatedAt: true,
} as const;

const publicRelations = {
  owner: { select: { id: true, name: true, avatarUrl: true } },
  categories: {
    select: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          icon: true,
        },
      },
    },
  },
  screenshots: {
    select: { id: true, url: true, alt: true, position: true },
    orderBy: { position: 'asc' as const },
  },
} as const;

const publicListSelect = {
  ...publicSaasFields,
  ...publicRelations,
  reviews: {
    where: { hidden: false, moderationStatus: 'APPROVED' },
    select: { rating: true },
  },
  _count: {
    select: {
      favorites: true,
      boosts: true,
      analyticsEvents: true,
      reviews: { where: { hidden: false, moderationStatus: 'APPROVED' } },
    },
  },
} satisfies Prisma.SaasSelect;

const publicDetailSelect = {
  ...publicSaasFields,
  ...publicRelations,
  reviews: {
    where: { hidden: false, moderationStatus: 'APPROVED' },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
  _count: { select: { boosts: true } },
} satisfies Prisma.SaasSelect;

type PublicListSaas = Prisma.SaasGetPayload<{
  select: typeof publicListSelect;
}>;

type SearchMatch = { id: string; rank: number };

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
      include: privateInclude,
    });
  }

  async update(ownerId: string, id: string, dto: UpdateSaasDto) {
    const current = await this.prisma.saas.findUnique({
      where: { id },
      include: {
        categories: { select: { categoryId: true } },
        screenshots: {
          select: { url: true },
          orderBy: { position: 'asc' },
        },
      },
    });
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
    const requiresReapproval =
      current.status === 'PUBLISHED' && this.hasSensitiveChanges(current, dto);
    if (requiresReapproval) {
      data.status = 'PENDING_REVIEW';
      data.rejectionReason = null;
    }
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
      const updated = await tx.saas.update({
        where: { id },
        data,
        include: privateInclude,
      });
      if (current.status === 'PUBLISHED')
        await tx.auditLog.create({
          data: {
            actorUserId: ownerId,
            action: requiresReapproval
              ? 'SAAS_REAPPROVAL_REQUESTED'
              : 'PUBLISHED_SAAS_UPDATED',
            entityType: 'Saas',
            entityId: id,
            metadata: {
              fields: Object.keys(dto),
              sensitiveFields: requiresReapproval
                ? this.changedSensitiveFields(current, dto)
                : [],
            },
          },
        });
      return { ...updated, requiresReapproval };
    });
  }

  async listPublic(query: ExploreQueryDto) {
    const where: Prisma.SaasWhereInput = { status: 'PUBLISHED' };
    const searchMatches = query.search
      ? await this.fullTextMatches(query.search)
      : null;
    if (searchMatches) {
      if (!searchMatches.length) return this.emptyPage(query);
      where.id = { in: searchMatches.map((match) => match.id) };
    }
    if (query.category)
      where.categories = { some: { category: { slug: query.category } } };
    if (query.pricingType) where.pricingType = query.pricingType;
    if (query.free) where.pricingType = 'FREE';
    if (query.trial) where.trialUrl = { not: null };
    where.isAdult =
      query.adult || query.category === 'adulto-18' ? true : false;
    if (query.minPrice !== undefined || query.maxPrice !== undefined)
      where.priceCents = { gte: query.minPrice, lte: query.maxPrice };
    if (query.sort === 'relevance' && searchMatches)
      return this.listByRelevance(where, query, searchMatches);
    if (query.sort === 'trending') return this.listTrendingPublic(where, query);
    const orderBy: Prisma.SaasOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { priceCents: 'asc' }
        : query.sort === 'price_desc'
          ? { priceCents: 'desc' }
          : { publishedAt: 'desc' };
    const now = new Date();
    const sponsoredWhere: Prisma.SaasWhereInput = {
      AND: [where, { sponsoredUntil: { gt: now } }],
    };
    const organicWhere: Prisma.SaasWhereInput = {
      AND: [
        where,
        { OR: [{ sponsoredUntil: null }, { sponsoredUntil: { lte: now } }] },
      ],
    };
    const [sponsoredTotal, total] = await this.prisma.$transaction([
      this.prisma.saas.count({ where: sponsoredWhere }),
      this.prisma.saas.count({ where }),
    ]);
    const skip = (query.page - 1) * query.pageSize;
    const sponsoredSkip = Math.min(skip, sponsoredTotal);
    const sponsoredTake = Math.max(
      0,
      Math.min(query.pageSize, sponsoredTotal - sponsoredSkip),
    );
    const sponsoredData = sponsoredTake
      ? await this.prisma.saas.findMany({
          where: sponsoredWhere,
          select: publicListSelect,
          orderBy: [{ sponsoredUntil: 'desc' }, orderBy],
          skip: sponsoredSkip,
          take: sponsoredTake,
        })
      : [];
    const organicTake = query.pageSize - sponsoredData.length;
    const organicSkip = Math.max(0, skip - sponsoredTotal);
    const organicData = organicTake
      ? await this.prisma.saas.findMany({
          where: organicWhere,
          select: publicListSelect,
          orderBy,
          skip: organicSkip,
          take: organicTake,
        })
      : [];
    const data = [...sponsoredData, ...organicData];
    const enriched = data.map((saas) =>
      this.toPublicListItem(
        saas,
        this.trending.score({
          views: saas._count.analyticsEvents,
          clicks: 0,
          favorites: saas._count.favorites,
          boosts: saas._count.boosts,
          reviews: saas._count.reviews,
          newestEventAt: saas.publishedAt,
        }),
      ),
    );
    if (query.sort === 'rating')
      enriched.sort(
        (a, b) =>
          Number(Boolean(b.isSponsored)) - Number(Boolean(a.isSponsored)) ||
          b.averageRating - a.averageRating,
      );
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
      select: publicDetailSelect,
    });
    if (!saas) throw new NotFoundException('SaaS não encontrado');
    const { _count, ...item } = saas;
    return {
      ...item,
      averageRating: this.average(saas.reviews),
      _count: { boosts: _count.boosts },
      isSponsored: this.isSponsored(item.sponsoredUntil),
    };
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
      include: privateInclude,
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

  private toPublicListItem(saas: PublicListSaas, score: number) {
    const { reviews, _count, ...item } = saas;
    return {
      ...item,
      averageRating: this.average(reviews),
      score,
      _count: { boosts: _count.boosts },
      isSponsored: this.isSponsored(item.sponsoredUntil),
    };
  }

  private isSponsored(sponsoredUntil?: Date | string | null) {
    return sponsoredUntil ? new Date(sponsoredUntil) > new Date() : false;
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
      select: publicListSelect,
      orderBy: { publishedAt: 'desc' },
    });
    const signals = await this.recentTrendSignals(
      data.map((saas) => saas.id),
      since,
    );
    const enriched = data
      .map((saas) =>
        this.toPublicListItem(
          saas,
          this.trending.score({
            ...this.emptySignals(saas.publishedAt),
            ...signals.get(saas.id),
            newestEventAt:
              signals.get(saas.id)?.newestEventAt ?? saas.publishedAt,
          }),
        ),
      )
      .sort(
        (a, b) =>
          Number(Boolean(b.isSponsored)) - Number(Boolean(a.isSponsored)) ||
          b.score - a.score ||
          a.name.localeCompare(b.name),
      );
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
    const [recent, analytics, favorites, boosts, sponsored, reviews] =
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
        this.prisma.saas.findMany({
          where: { AND: [where, { sponsoredUntil: { gt: new Date() } }] },
          select: { id: true },
          orderBy: { sponsoredUntil: 'desc' },
        }),
        this.prisma.review.groupBy({
          by: ['saasId'],
          where: {
            createdAt: { gte: since },
            hidden: false,
            moderationStatus: 'APPROVED',
          },
          orderBy: { saasId: 'asc' },
        }),
      ]);
    return [
      ...new Set([
        ...recent.map((item) => item.id),
        ...analytics.map((item) => item.saasId),
        ...favorites.map((item) => item.saasId),
        ...boosts.map((item) => item.saasId),
        ...sponsored.map((item) => item.id),
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
            moderationStatus: 'APPROVED',
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

  private async fullTextMatches(search: string): Promise<SearchMatch[]> {
    const term = search.trim();
    if (!term) return [];
    return this.prisma.$queryRaw<SearchMatch[]>(Prisma.sql`
      WITH query AS (
        SELECT websearch_to_tsquery('portuguese', ${term}) AS value
      )
      SELECT s.id,
        (
          ts_rank_cd(s."searchVector", query.value, 32) * 10 +
          GREATEST(
            similarity(lower(s."name"), lower(${term})) * 3,
            similarity(lower(s."tagline"), lower(${term}))
          )
        )::double precision AS rank
      FROM "Saas" s
      CROSS JOIN query
      WHERE s.status = 'PUBLISHED'::"SaasStatus"
        AND (
          s."searchVector" @@ query.value
          OR similarity(lower(s."name"), lower(${term})) > 0.2
          OR similarity(lower(s."tagline"), lower(${term})) > 0.25
          OR EXISTS (
            SELECT 1
            FROM "SaasCategory" sc
            JOIN "Category" c ON c.id = sc."categoryId"
            WHERE sc."saasId" = s.id
              AND (
                to_tsvector('portuguese', c.name || ' ' || c.description) @@ query.value
                OR similarity(lower(c.name), lower(${term})) > 0.25
              )
          )
        )
      ORDER BY rank DESC, s."publishedAt" DESC NULLS LAST
      LIMIT 2000
    `);
  }

  private async listByRelevance(
    where: Prisma.SaasWhereInput,
    query: ExploreQueryDto,
    matches: SearchMatch[],
  ) {
    const data = await this.prisma.saas.findMany({
      where,
      select: publicListSelect,
    });
    const ranks = new Map(matches.map((match) => [match.id, match.rank]));
    const enriched = data
      .map((saas) =>
        this.toPublicListItem(saas, Number(ranks.get(saas.id) ?? 0)),
      )
      .sort(
        (a, b) =>
          Number(Boolean(b.isSponsored)) - Number(Boolean(a.isSponsored)) ||
          b.score - a.score ||
          a.name.localeCompare(b.name),
      );
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

  private emptyPage(query: ExploreQueryDto) {
    return {
      data: [],
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: 0,
        totalPages: 0,
      },
    };
  }

  private hasSensitiveChanges(
    current: Prisma.SaasGetPayload<{
      include: {
        categories: { select: { categoryId: true } };
        screenshots: { select: { url: true } };
      };
    }>,
    dto: UpdateSaasDto,
  ) {
    return this.changedSensitiveFields(current, dto).length > 0;
  }

  private changedSensitiveFields(
    current: Prisma.SaasGetPayload<{
      include: {
        categories: { select: { categoryId: true } };
        screenshots: { select: { url: true } };
      };
    }>,
    dto: UpdateSaasDto,
  ) {
    const changed: string[] = [];
    const scalarFields = [
      'name',
      'slug',
      'tagline',
      'shortDescription',
      'description',
      'logoUrl',
      'websiteUrl',
      'trialUrl',
      'checkoutUrl',
      'docsUrl',
      'demoUrl',
      'isAdult',
    ] as const;
    for (const field of scalarFields) {
      if (dto[field] === undefined) continue;
      const next =
        typeof dto[field] === 'string' ? dto[field].trim() : dto[field];
      const before = current[field] ?? '';
      if (next !== before) changed.push(field);
    }
    if (
      dto.tags &&
      !this.sameList(this.cleanList(dto.tags), this.cleanList(current.tags))
    )
      changed.push('tags');
    if (
      dto.categoryIds &&
      !this.sameList(
        dto.categoryIds,
        current.categories.map((category) => category.categoryId),
      )
    )
      changed.push('categoryIds');
    if (
      dto.screenshotUrls &&
      !this.sameList(
        dto.screenshotUrls,
        current.screenshots.map((screenshot) => screenshot.url),
        false,
      )
    )
      changed.push('screenshotUrls');
    return changed;
  }

  private sameList(left: string[], right: string[], sort = true) {
    const a = sort ? [...left].sort() : left;
    const b = sort ? [...right].sort() : right;
    return (
      a.length === b.length && a.every((value, index) => value === b[index])
    );
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
