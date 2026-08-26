import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AnalyticsEventType } from '../../generated/prisma/client';
import { createHmac } from 'node:crypto';
import { assertOwnership } from '../../common/ownership';
import { assertSafeExternalUrl } from '../../common/safe-url';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}
  record(
    saasId: string,
    type: AnalyticsEventType,
    referrer?: string,
    ip?: string,
  ) {
    const visitorHash = ip
      ? createHmac('sha256', process.env.AUTH_SECRET!).update(ip).digest('hex')
      : undefined;
    return this.prisma.analyticsEvent.create({
      data: { saasId, type, referrer: referrer?.slice(0, 500), visitorHash },
    });
  }
  async resolveRedirect(
    slug: string,
    type: AnalyticsEventType,
    referrer?: string,
    ip?: string,
  ) {
    if (!['WEBSITE_CLICK', 'TRIAL_CLICK'].includes(type))
      throw new ForbiddenException('Tipo de CTA inválido');
    const saas = await this.prisma.saas.findFirst({
      where: { slug, status: 'PUBLISHED' },
      select: { id: true, websiteUrl: true, trialUrl: true },
    });
    if (!saas) throw new NotFoundException('SaaS não encontrado');
    const target = type === 'TRIAL_CLICK' ? saas.trialUrl : saas.websiteUrl;
    if (!target) throw new NotFoundException('Link indisponível');
    await this.record(saas.id, type, referrer, ip);
    return assertSafeExternalUrl(target);
  }
  async ownerAnalytics(ownerId: string, saasId: string, days = 30) {
    const saas = await this.prisma.saas.findUnique({ where: { id: saasId } });
    assertOwnership(saas, ownerId);
    const since = new Date(
      Date.now() - Math.min(Math.max(days, 1), 90) * 86_400_000,
    );
    const events = await this.prisma.analyticsEvent.findMany({
      where: { saasId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });
    const totals = {
      PAGE_VIEW: 0,
      WEBSITE_CLICK: 0,
      TRIAL_CLICK: 0,
      FAVORITE: 0,
    };
    const byDay = new Map<
      string,
      { date: string; views: number; clicks: number }
    >();
    for (const event of events) {
      totals[event.type]++;
      const date = event.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(date) ?? { date, views: 0, clicks: 0 };
      if (event.type === 'PAGE_VIEW') bucket.views++;
      if (event.type.endsWith('CLICK')) bucket.clicks++;
      byDay.set(date, bucket);
    }
    const clicks = totals.WEBSITE_CLICK + totals.TRIAL_CLICK;
    return {
      totals,
      ctr: totals.PAGE_VIEW
        ? Number(((clicks / totals.PAGE_VIEW) * 100).toFixed(1))
        : 0,
      series: [...byDay.values()],
    };
  }
  async dashboard(ownerId: string) {
    const products = await this.prisma.saas.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const ids = products.map((item) => item.id);
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: { saasId: { in: ids } },
      _count: true,
    });
    const count = (type: AnalyticsEventType) =>
      grouped.find((item) => item.type === type)?._count ?? 0;
    return {
      saas: products.length,
      views: count('PAGE_VIEW'),
      clicks: count('WEBSITE_CLICK') + count('TRIAL_CLICK'),
      trialClicks: count('TRIAL_CLICK'),
      favorites: count('FAVORITE'),
    };
  }
}
