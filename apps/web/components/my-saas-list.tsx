'use client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Edit3, Eye, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { clientApi, money } from '@/lib/api';
import { Saas } from '@/lib/types';
import { EmptyState } from './empty-state';
import { StatusBadge } from './status-badge';

type Config = {
  sponsoredPlacementEnabled: boolean;
  sponsoredPlacementPriceCents: number;
  sponsoredPlacementDurationDays: number;
  sponsoredPlacementCurrency: string;
};

export function MySaasList() {
  const { data = [] } = useQuery({
    queryKey: ['mine'],
    queryFn: () => clientApi<Saas[]>('/me/saas'),
  });
  const { data: config } = useQuery({
    queryKey: ['public-config'],
    queryFn: () => clientApi<Config>('/config/public'),
  });
  return (
    <>
      {data.length ? (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Status</th>
                <th>Views / cliques</th>
                <th>Destaque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    <br />
                    <span className="muted">
                      {new Date(p.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{p._count?.analyticsEvents ?? 0}</td>
                  <td>
                    <SponsorshipCell saas={p} config={config} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {p.status === 'PUBLISHED' && (
                        <Link className="btn btn-sm" href={`/saas/${p.slug}`}>
                          <Eye size={14} />
                        </Link>
                      )}
                      <Link
                        className="btn btn-sm"
                        href={`/dashboard/saas/${p.id}/edit`}
                      >
                        <Edit3 size={14} />
                      </Link>
                      <Link
                        className="btn btn-sm"
                        href={`/dashboard/saas/${p.id}/analytics`}
                      >
                        <BarChart3 size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          actionHref="/dashboard/saas/new"
          actionLabel="Cadastrar SaaS"
        />
      )}
    </>
  );
}

function SponsorshipCell({
  saas,
  config,
}: {
  saas: Saas;
  config?: Config;
}) {
  const [loading, setLoading] = useState(false);
  const sponsoredUntil = saas.sponsoredUntil
    ? new Date(saas.sponsoredUntil)
    : null;
  const active = Boolean(sponsoredUntil && sponsoredUntil > new Date());
  if (saas.status !== 'PUBLISHED')
    return <span className="muted">Disponível após publicação</span>;
  if (config?.sponsoredPlacementEnabled === false)
    return <span className="muted">Indisponível</span>;
  const price = money(
    config?.sponsoredPlacementPriceCents ?? 2990,
    config?.sponsoredPlacementCurrency ?? 'BRL',
  );
  const days = config?.sponsoredPlacementDurationDays ?? 7;
  async function buy() {
    setLoading(true);
    try {
      const result = await clientApi<{ checkoutUrl: string }>(
        `/me/saas/${saas.id}/sponsorship-checkout`,
        { method: 'POST' },
      );
      location.href = result.checkoutUrl;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar o checkout',
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div style={{ display: 'grid', gap: 8, justifyItems: 'start' }}>
      {active && sponsoredUntil ? (
        <span className="pill pill-sponsored">
          <Megaphone size={13} />
          Até {sponsoredUntil.toLocaleDateString('pt-BR')}
        </span>
      ) : (
        <span className="muted">Sem destaque ativo</span>
      )}
      <button
        className="btn btn-sm"
        type="button"
        onClick={buy}
        disabled={loading}
      >
        <Megaphone size={14} />
        {loading
          ? 'Abrindo...'
          : active
            ? `Renovar ${days}d`
            : `${price} / ${days}d`}
      </button>
    </div>
  );
}
