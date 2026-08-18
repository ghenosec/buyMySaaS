'use client';
import { useQuery } from '@tanstack/react-query';
import { clientApi } from '@/lib/api';
import { Saas } from '@/lib/types';
import { EmptyState } from './empty-state';
import { SaasCard } from './saas-card';
type Favorite = { saas: Saas };
export function FavoritesList() {
  const { data = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => clientApi<Favorite[]>('/me/favorites'),
  });
  return data.length ? (
    <div
      className="grid-cards"
      style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}
    >
      {data.map((f) => (
        <SaasCard key={f.saas.id} saas={f.saas} />
      ))}
    </div>
  ) : (
    <EmptyState
      title="Nenhum favorito ainda"
      description="Salve os produtos que você quer acompanhar."
      actionHref="/explore"
      actionLabel="Explorar SaaS"
    />
  );
}
