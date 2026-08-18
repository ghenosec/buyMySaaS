import type { Metadata } from 'next';
import { BadgePercent } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { SaasCard } from '@/components/saas-card';
import { getDeals } from '@/lib/api';
export const metadata: Metadata = {
  title: 'Indie Deals',
  description: 'Promoções e ofertas de SaaS independentes.',
};
export default async function Deals() {
  const deals = await getDeals();
  return (
    <div className="container">
      <header className="page-head">
        <span className="pill" style={{ color: 'var(--brand)' }}>
          <BadgePercent size={14} />
          Ofertas ativas
        </span>
        <h1>Indie Deals.</h1>
        <p className="muted">
          Descontos, cupons e licenças lifetime oferecidos diretamente pelos
          makers.
        </p>
      </header>
      {deals.length ? (
        <div className="grid-cards">
          {deals.map((deal) => (
            <SaasCard key={deal.id} saas={{ ...deal.saas, deal }} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum deal ativo"
          description="Volte em breve para novas ofertas."
        />
      )}
    </div>
  );
}
