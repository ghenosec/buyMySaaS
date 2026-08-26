'use client';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Edit3, Eye } from 'lucide-react';
import Link from 'next/link';
import { clientApi } from '@/lib/api';
import { Saas } from '@/lib/types';
import { EmptyState } from './empty-state';
import { StatusBadge } from './status-badge';

export function MySaasList() {
  const { data = [] } = useQuery({
    queryKey: ['mine'],
    queryFn: () => clientApi<Saas[]>('/me/saas'),
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
