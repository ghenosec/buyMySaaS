import { TrendingService } from './trending.service';
describe('TrendingService', () => {
  const service = new TrendingService();
  it('dá mais peso a sinais de alta intenção', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(
      service.score(
        {
          views: 10,
          clicks: 4,
          favorites: 2,
          boosts: 1,
          reviews: 1,
          newestEventAt: now,
        },
        now,
      ),
    ).toBeGreaterThan(
      service.score(
        {
          views: 20,
          clicks: 0,
          favorites: 0,
          boosts: 0,
          reviews: 0,
          newestEventAt: now,
        },
        now,
      ),
    );
  });
  it('aplica decay temporal', () => {
    const now = new Date('2026-01-08T00:00:00Z');
    expect(
      service.score(
        {
          views: 100,
          clicks: 0,
          favorites: 0,
          boosts: 0,
          reviews: 0,
          newestEventAt: new Date('2026-01-08T00:00:00Z'),
        },
        now,
      ),
    ).toBeGreaterThan(
      service.score(
        {
          views: 100,
          clicks: 0,
          favorites: 0,
          boosts: 0,
          reviews: 0,
          newestEventAt: new Date('2026-01-01T00:00:00Z'),
        },
        now,
      ),
    );
  });
});
