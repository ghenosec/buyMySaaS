import { Injectable } from '@nestjs/common';

export type TrendSignals = {
  views: number;
  clicks: number;
  favorites: number;
  reviews: number;
  newestEventAt?: Date | null;
};

@Injectable()
export class TrendingService {
  score(signals: TrendSignals, now = new Date()): number {
    const ageHours = signals.newestEventAt
      ? Math.max(
          0,
          (now.getTime() - signals.newestEventAt.getTime()) / 3_600_000,
        )
      : 168;
    const decay = Math.exp(-ageHours / 168);
    return Number(
      (
        (signals.views +
          signals.clicks * 3 +
          signals.favorites * 4 +
          signals.reviews * 6) *
        decay
      ).toFixed(4),
    );
  }
}
