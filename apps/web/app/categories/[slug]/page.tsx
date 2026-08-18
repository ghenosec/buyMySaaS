import { SaasCard } from '@/components/saas-card';
import { EmptyState } from '@/components/empty-state';
import { getCatalog, getCategories } from '@/lib/api';
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [catalog, categories] = await Promise.all([
    getCatalog(`?category=${slug}`),
    getCategories(),
  ]);
  const category = categories.find((c) => c.slug === slug);
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Categoria</span>
        <h1>{category?.name ?? slug}</h1>
        <p className="muted">{category?.description}</p>
      </header>
      {catalog.data.length ? (
        <div className="grid-cards">
          {catalog.data.map((s) => (
            <SaasCard key={s.id} saas={s} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
