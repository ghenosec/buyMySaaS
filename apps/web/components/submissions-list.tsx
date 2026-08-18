'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { clientApi } from '@/lib/api';
import { Saas } from '@/lib/types';
import { EmptyState } from './empty-state';
import { StatusBadge } from './status-badge';
type Item = Saas & { owner: { name: string; email: string } };
export function SubmissionsList() {
  const { data = [] } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => clientApi<Item[]>('/admin/submissions'),
  });
  return data.length ? (
    <div className="card table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Maker</th>
            <th>Status</th>
            <th>Atualizado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={s.id}>
              <td>
                <strong>{s.name}</strong>
                <br />
                <span className="muted">{s.tagline}</span>
              </td>
              <td>{s.owner.name}</td>
              <td>
                <StatusBadge status={s.status} />
              </td>
              <td>{new Date(s.updatedAt).toLocaleDateString('pt-BR')}</td>
              <td>
                <Link
                  className="btn btn-sm"
                  href={`/admin/submissions/${s.id}`}
                >
                  Abrir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <EmptyState
      title="Fila em dia"
      description="Não há submissões aguardando análise."
    />
  );
}
