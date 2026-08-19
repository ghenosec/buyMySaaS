'use client';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3, Package, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { clientApi } from '@/lib/api';
import { Saas } from '@/lib/types';
import { StatusBadge } from './status-badge';
type Data = {
  pending: number;
  published: number;
  users: number;
  recentSubmissions: (Saas & { owner: { name: string; email: string } })[];
};
export function AdminDashboard() {
  const { data, error } = useQuery({
    queryKey: ['admin'],
    queryFn: () => clientApi<Data>('/admin'),
  });
  if (error)
    return (
      <div className="notice error">
        Você precisa entrar com uma conta administradora.
      </div>
    );
  const cards: { Icon: LucideIcon; label: string; value?: number }[] = [
    { Icon: Clock3, label: 'Em análise', value: data?.pending },
    { Icon: CheckCircle2, label: 'Publicados', value: data?.published },
    { Icon: Users, label: 'Usuários', value: data?.users },
    {
      Icon: Package,
      label: 'Total no fluxo',
      value: (data?.pending ?? 0) + (data?.published ?? 0),
    },
  ];
  return (
    <>
      <div className="dashboard-grid">
        {cards.map(({ Icon, label, value }) => (
          <div className="card stat" key={label}>
            <Icon size={18} color="var(--brand)" />
            <span className="muted">{label}</span>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </div>
      <section className="section">
        <div className="section-title">
          <h2>Submissões recentes</h2>
          <Link className="btn btn-sm" href="/admin/submissions">
            Ver fila
          </Link>
        </div>
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Maker</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.recentSubmissions.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>
                    {s.owner.name}
                    <br />
                    <span className="muted">{s.owner.email}</span>
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
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
      </section>
    </>
  );
}
