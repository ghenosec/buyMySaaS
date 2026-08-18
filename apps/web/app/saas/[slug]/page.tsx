import type { Metadata } from 'next';
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Globe2,
  MapPin,
  Star,
  UserRound,
} from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  FavoriteButton,
  PageView,
  ReviewForm,
} from '@/components/product-actions';
import { browserApiUrl, money, publicApi } from '@/lib/api';
import { Saas } from '@/lib/types';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const saas = await publicApi<Saas | null>(`/saas/${slug}`, null);
  if (!saas) return { title: 'Produto não encontrado' };
  return {
    title: saas.name,
    description: saas.shortDescription,
    alternates: { canonical: `/saas/${slug}` },
    openGraph: {
      title: `${saas.name} — ${saas.tagline}`,
      description: saas.shortDescription,
      images: saas.logoUrl ? [saas.logoUrl] : undefined,
    },
  };
}
export default async function SaasDetail({ params }: Props) {
  const { slug } = await params;
  const saas = await publicApi<Saas | null>(`/saas/${slug}`, null, {
    cache: 'no-store',
  });
  if (!saas) notFound();
  const cta = saas.trialUrl
    ? { label: 'Testar grátis', type: 'TRIAL_CLICK' }
    : saas.checkoutUrl
      ? {
          label: saas.pricingType === 'SUBSCRIPTION' ? 'Assinar' : 'Comprar',
          type: 'BUY_CLICK',
        }
      : { label: 'Acessar SaaS', type: 'WEBSITE_CLICK' };
  const price =
    saas.pricingType === 'FREE'
      ? 'Grátis'
      : saas.pricingType === 'FREEMIUM'
        ? 'Freemium'
        : money(
            saas.priceCents,
            saas.currency,
          );
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: saas.name,
    description: saas.shortDescription,
    applicationCategory: saas.categories?.[0]?.category.name,
    offers: {
      '@type': 'Offer',
      price: (saas.priceCents ?? 0) / 100,
      priceCurrency: saas.currency,
    },
    aggregateRating:
      (saas.averageRating ?? 0) > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: saas.averageRating,
            reviewCount: saas.reviews?.length ?? 0,
          }
        : undefined,
  };
  return (
    <div className="container">
      <PageView saasId={saas.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header
        className="page-head"
        style={{ display: 'flex', gap: 20, alignItems: 'center' }}
      >
        {saas.logoUrl ? (
          <Image
            className="saas-logo"
            style={{ width: 76, height: 76, borderRadius: 20 }}
            src={saas.logoUrl}
            alt={`Logo ${saas.name}`}
            width={76}
            height={76}
          />
        ) : null}
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {saas.categories?.map((c) => (
              <span className="pill" key={c.category.id}>
                {c.category.name}
              </span>
            ))}
            {saas.isBrazilian && (
              <span className="pill">
                <MapPin size={13} />
                Feito no Brasil
              </span>
            )}
          </div>
          <h1
            style={{ fontSize: 'clamp(36px,6vw,58px)', margin: '12px 0 5px' }}
          >
            {saas.name}
          </h1>
          <p style={{ fontSize: 19, margin: 0 }} className="muted">
            {saas.tagline}
          </p>
        </div>
      </header>
      <div className="detail-grid">
        <article className="stack">
          <section className="card" style={{ padding: 26 }}>
            <h2>Sobre o produto</h2>
            <p style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
              {saas.description}
            </p>
          </section>
          {saas.screenshots?.length ? (
            <section>
              <h2>Screenshots</h2>
              <div className="stack">
                {saas.screenshots.map((s) => (
                  <Image
                    key={s.id}
                    src={s.url}
                    alt={s.alt}
                    width={1100}
                    height={680}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: 16,
                      border: '1px solid var(--line)',
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null}
          <section>
            <h2>
              Avaliações{' '}
              <span className="muted">({saas.reviews?.length ?? 0})</span>
            </h2>
            <div className="stack">
              {saas.reviews?.map((review) => (
                <article
                  className="card"
                  style={{ padding: 19 }}
                  key={review.id}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <strong>{review.user.name}</strong>
                    <span style={{ color: '#e6a600' }}>
                      {'★'.repeat(review.rating)}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <ReviewForm saasId={saas.id} />
            </div>
          </section>
        </article>
        <aside className="card detail-aside">
          <span className="eyebrow">A partir de</span>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: '-.04em',
              margin: '5px 0',
            }}
          >
            {price}
          </div>
          {saas.billingInterval === 'MONTH' && (
            <span className="muted">por mês</span>
          )}
          <a
            className="btn btn-primary"
            style={{ width: '100%', margin: '18px 0 9px' }}
            href={`${browserApiUrl}/saas/${saas.slug}/out?type=${cta.type}`}
          >
            {cta.label}
            <ArrowUpRight size={17} />
          </a>
          <FavoriteButton saasId={saas.id} />
          <div
            className="stack"
            style={{
              borderTop: '1px solid var(--line)',
              marginTop: 20,
              paddingTop: 18,
              fontSize: 14,
            }}
          >
            <span>
              <UserRound
                size={15}
                style={{ display: 'inline', marginRight: 8 }}
              />
              Por {saas.owner?.name}
            </span>
            <span>
              <Globe2 size={15} style={{ display: 'inline', marginRight: 8 }} />
              {saas.countryCode}
            </span>
            <span>
              <Star size={15} style={{ display: 'inline', marginRight: 8 }} />
              {saas.averageRating ?? 0} · {saas.reviews?.length ?? 0} avaliações
            </span>
            {saas.publishedAt && (
              <span>
                <CalendarDays
                  size={15}
                  style={{ display: 'inline', marginRight: 8 }}
                />
                Publicado em{' '}
                {new Date(saas.publishedAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          {saas.technologies.length > 0 && (
            <div
              style={{
                borderTop: '1px solid var(--line)',
                marginTop: 18,
                paddingTop: 18,
              }}
            >
              <strong>Tecnologias</strong>
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  marginTop: 10,
                }}
              >
                {saas.technologies.map((t) => (
                  <span className="pill" key={t}>
                    <Check size={12} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
