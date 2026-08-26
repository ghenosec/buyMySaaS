import { ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';
import { CategoryCard } from '@/components/category-card';
import { EmptyState } from '@/components/empty-state';
import { SaasCard } from '@/components/saas-card';
import { SearchBar } from '@/components/search-bar';
import { SectionHeading } from '@/components/section-heading';
import { PublishSaasLink } from '@/components/publish-saas-link';
import { getCatalog, getCategories } from '@/lib/api';

export default async function Home() {
  const [trending, recent, affordable, categories] = await Promise.all([
    getCatalog('?sort=trending&pageSize=8'),
    getCatalog('?sort=recent&pageSize=4'),
    getCatalog('?maxPrice=2000&pageSize=4'),
    getCategories(),
  ]);
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <span
            className="pill"
            style={{ margin: 'auto', color: 'var(--brand)' }}
          >
            <Rocket size={14} /> Feito por makers, para quem gosta de descobrir
          </span>
          <h1>
            Descubra seu próximo{' '}
            <span style={{ color: 'var(--brand)' }}>SaaS favorito.</span>
          </h1>
          <p>
            Ferramentas independentes criadas por desenvolvedores que estão
            construindo algo novo. Descubra produtos ou publique o seu
            gratuitamente.
          </p>
          <SearchBar />
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/explore">
              Explorar SaaS <ArrowRight size={17} />
            </Link>
            <PublishSaasLink />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading
            title="Em alta"
            subtitle="Produtos ganhando atenção da comunidade agora."
            href="/explore?sort=trending"
          />
          {trending.data.length ? (
            <div className="grid-cards">
              {trending.data.map((s) => (
                <SaasCard saas={s} key={s.id} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading
            title="Lançados recentemente"
            href="/explore?sort=recent"
          />
          <div className="grid-cards">
            {recent.data.map((s) => (
              <SaasCard saas={s} key={s.id} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading
            title="Até R$ 20/mês"
            subtitle="Ferramentas acessíveis para começar hoje."
            href="/explore?maxPrice=2000"
          />
          <div className="grid-cards">
            {affordable.data.map((s) => (
              <SaasCard saas={s} key={s.id} />
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading title="Explore por categoria" href="/categories" />
          <div className="category-grid">
            {categories.slice(0, 10).map((c) => (
              <CategoryCard category={c} key={c.id} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
