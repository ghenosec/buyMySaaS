'use client';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
type Data = {
  totals: Record<string, number>;
  ctr: number;
  series: { date: string; views: number; clicks: number }[];
};
export function AnalyticsChart({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => clientApi<Data>(`/me/saas/${id}/analytics?days=30`),
  });
  const max = Math.max(
    1,
    ...(data?.series.map((d) => Math.max(d.views, d.clicks)) ?? [1]),
  );
  return (
    <>
      <div className="dashboard-grid">
        {[
          ['Views', data?.totals.PAGE_VIEW],
          ['Cliques no site', data?.totals.WEBSITE_CLICK],
          ['Trial', data?.totals.TRIAL_CLICK],
          ['CTR', `${data?.ctr ?? 0}%`],
        ].map(([label, value]) => (
          <div className="card stat" key={String(label)}>
            <span className="muted">{label}</span>
            <strong>{value ?? 0}</strong>
          </div>
        ))}
      </div>
      <section className="card" style={{ padding: 24, marginTop: 20 }}>
        <h2>Últimos 30 dias</h2>
        <div
          style={{
            height: 260,
            display: 'flex',
            alignItems: 'end',
            gap: 5,
            borderBottom: '1px solid var(--line)',
            paddingTop: 20,
          }}
        >
          {data?.series.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.views} views, ${day.clicks} cliques`}
              style={{
                flex: 1,
                minWidth: 4,
                display: 'flex',
                alignItems: 'end',
                gap: 2,
                height: '100%',
              }}
            >
              <span
                style={{
                  flex: 1,
                  height: `${(day.views / max) * 100}%`,
                  background: 'var(--brand)',
                  borderRadius: '4px 4px 0 0',
                }}
              />
              <span
                style={{
                  flex: 1,
                  height: `${(day.clicks / max) * 100}%`,
                  background: 'var(--accent)',
                  borderRadius: '4px 4px 0 0',
                }}
              />
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          Verde: visualizações · Lima: cliques
        </p>
      </section>
    </>
  );
}
