import type { Metadata } from 'next';
import { SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SaasCard } from '@/components/saas-card';
import { SearchBar } from '@/components/search-bar';
import { getCatalog, getCategories } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Explorar SaaS',
  description: 'Pesquise e filtre produtos SaaS independentes.',
};
type Props = { searchParams: Promise<Record<string, string | undefined>> };
export default async function Explore({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v)) as Record<
      string,
      string
    >,
  ).toString();
  const [result, categories] = await Promise.all([
    getCatalog(`?${query}`),
    getCategories(),
  ]);
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Catálogo independente</span>
        <h1>Encontre a ferramenta certa.</h1>
        <p className="muted">
          Filtros rápidos, preços claros e produtos feitos por pessoas reais.
        </p>
      </header>
      <div className="filters">
        <aside className="card filter-panel">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <SlidersHorizontal size={18} />
            <strong>Filtros</strong>
          </div>
          <form className="stack">
            <label className="label">
              Categoria
              <select
                className="input"
                name="category"
                defaultValue={params.category ?? ''}
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option value={c.slug} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="label">
              Modelo
              <select
                className="input"
                name="pricingType"
                defaultValue={params.pricingType ?? ''}
              >
                <option value="">Todos</option>
                <option value="FREE">Grátis</option>
                <option value="FREEMIUM">Freemium</option>
                <option value="SUBSCRIPTION">Assinatura</option>
                <option value="ONE_TIME">Pagamento único</option>
                <option value="LIFETIME">Lifetime</option>
              </select>
            </label>
            <label className="label">
              Preço máximo
              <input
                className="input"
                name="maxPrice"
                type="number"
                min="0"
                step="100"
                defaultValue={params.maxPrice}
                placeholder="Em centavos"
              />
            </label>
            <label className="label">
              Ordenar
              <select
                className="input"
                name="sort"
                defaultValue={params.sort ?? 'trending'}
              >
                <option value="trending">Em alta</option>
                <option value="recent">Mais recentes</option>
                <option value="rating">Mais bem avaliados</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
            </label>
            <label style={{ display: 'flex', gap: 8 }}>
              <input
                type="checkbox"
                name="trial"
                value="true"
                defaultChecked={params.trial === 'true'}
              />{' '}
              Possui trial
            </label>
            <label style={{ display: 'flex', gap: 8 }}>
              <input
                type="checkbox"
                name="brazilian"
                value="true"
                defaultChecked={params.brazilian === 'true'}
              />{' '}
              Feito no Brasil
            </label>
            {params.search && (
              <input type="hidden" name="search" value={params.search} />
            )}
            <button className="btn btn-primary">Aplicar filtros</button>
          </form>
        </aside>
        <div>
          <SearchBar compact defaultValue={params.search} />
          <p className="muted" style={{ fontSize: 14 }}>
            {result.meta.total} produtos encontrados
          </p>
          {result.data.length ? (
            <div
              className="grid-cards"
              style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}
            >
              {result.data.map((s) => (
                <SaasCard saas={s} key={s.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum produto encontrado"
              description="Remova alguns filtros ou tente outra busca."
            />
          )}
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            params={params}
          />
        </div>
      </div>
    </div>
  );
}
