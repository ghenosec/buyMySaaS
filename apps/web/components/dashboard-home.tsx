'use client';
import {
  ArrowUpRight,
  Eye,
  MousePointerClick,
  Package,
  Plus,
  Rocket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { Saas } from '@/lib/types';
import { EmptyState } from './empty-state';
import { StatusBadge } from './status-badge';
type Stats = {
  saas: number;
  views: number;
  clicks: number;
  buyClicks: number;
  trialClicks: number;
  favorites: number;
};
export function DashboardHome() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => clientApi<Stats>('/me/dashboard'),
  });
  const { data: products } = useQuery({
    queryKey: ['mine'],
    queryFn: () => clientApi<Saas[]>('/me/saas'),
  });
  if (error)
    return (
      <div className="notice error">Faça login para acessar o dashboard.</div>
    );
  const cards: { Icon: LucideIcon; label: string; value?: number }[] = [
    { Icon: Package, label: 'Meus SaaS', value: stats?.saas },
    { Icon: Eye, label: 'Visualizações', value: stats?.views },
    { Icon: MousePointerClick, label: 'Cliques', value: stats?.clicks },
    { Icon: Rocket, label: 'Cliques em compra', value: stats?.buyClicks },
  ];
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Dashboard do maker</span>
        <h1>Seu trabalho, em movimento.</h1>
        <p className="muted">
          Acompanhe o catálogo e o que desperta interesse.
        </p>
      </header>
      <div className="dashboard-grid">
        {cards.map(({ Icon, label, value }) => (
          <div className="card stat" key={label}>
            <Icon size={19} color="var(--brand)" />
            <span className="muted">{label}</span>
            <strong>{isLoading ? '—' : String(value ?? 0)}</strong>
          </div>
        ))}
      </div>
      <section className="section">
        <div className="section-title">
          <h2>Meus SaaS</h2>
          <Link className="btn btn-primary btn-sm" href="/dashboard/saas/new">
            <Plus size={15} />
            Novo SaaS
          </Link>
        </div>
        {products?.length ? (
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Status</th>
                  <th>Interações</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <br />
                      <span className="muted">{p.tagline}</span>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>{p._count?.analyticsEvents ?? 0}</td>
                    <td>
                      <Link
                        className="btn btn-sm"
                        href={`/dashboard/saas/${p.id}/edit`}
                      >
                        Abrir <ArrowUpRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Seu primeiro produto começa aqui"
            description="Cadastre o SaaS, revise o anúncio e envie para publicação."
            actionHref="/dashboard/saas/new"
            actionLabel="Cadastrar SaaS"
          />
        )}
      </section>
    </>
  );
}
