import { ArrowUpRight, BadgePercent, MapPin, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { money } from '@/lib/api';
import { Saas } from '@/lib/types';

export function SaasCard({ saas }: { saas: Saas }) {
  const price =
    saas.pricingType === 'FREE'
      ? 'Grátis'
      : saas.pricingType === 'FREEMIUM'
        ? 'Freemium'
        : money(
            saas.deal?.promotionalPriceCents ?? saas.priceCents,
            saas.currency,
          );
  return (
    <Link className="card saas-card" href={`/saas/${saas.slug}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {saas.logoUrl ? (
          <Image
            className="saas-logo"
            src={saas.logoUrl}
            alt={`Logo ${saas.name}`}
            width={48}
            height={48}
          />
        ) : (
          <span
            className="saas-logo"
            style={{ display: 'grid', placeItems: 'center', fontWeight: 900 }}
          >
            {saas.name[0]}
          </span>
        )}
        <ArrowUpRight size={18} className="muted" />
      </div>
      <div style={{ margin: '17px 0 10px' }}>
        <h3
          style={{ fontSize: 18, margin: '0 0 4px', letterSpacing: '-.025em' }}
        >
          {saas.name}
        </h3>
        <p
          className="muted"
          style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}
        >
          {saas.tagline}
        </p>
      </div>
      <div
        style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 'auto' }}
      >
        {saas.deal && (
          <span className="pill" style={{ color: 'var(--brand)' }}>
            <BadgePercent size={13} />
            {saas.deal.discountPercent
              ? `-${saas.deal.discountPercent}%`
              : 'Deal'}
          </span>
        )}
        {saas.isBrazilian && (
          <span className="pill">
            <MapPin size={13} />
            Brasil
          </span>
        )}
        {(saas.averageRating ?? 0) > 0 && (
          <span className="pill">
            <Star size={13} fill="currentColor" />
            {saas.averageRating}
          </span>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          borderTop: '1px solid var(--line)',
          marginTop: 16,
          paddingTop: 14,
        }}
      >
        <span className="price">{price}</span>
        <span className="muted" style={{ fontSize: 12 }}>
          {saas.billingInterval === 'MONTH' && '/mês'}
          {saas.billingInterval === 'YEAR' && '/ano'}
        </span>
      </div>
    </Link>
  );
}
