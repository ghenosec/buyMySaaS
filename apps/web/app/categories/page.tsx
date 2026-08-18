import type { Metadata } from 'next';
import { CategoryCard } from '@/components/category-card';
import { getCategories } from '@/lib/api';
export const metadata: Metadata = { title: 'Categorias' };
export default async function Categories() {
  const categories = await getCategories();
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Navegue por assunto</span>
        <h1>Todas as categorias.</h1>
        <p className="muted">Do primeiro commit à primeira venda.</p>
      </header>
      <div className="category-grid">
        {categories.map((c) => (
          <CategoryCard key={c.id} category={c} />
        ))}
      </div>
    </div>
  );
}
