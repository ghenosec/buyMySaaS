import { ArrowRight, Boxes } from 'lucide-react';
import Link from 'next/link';
import { Category } from '@/lib/types';
export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}`} className="card category-card">
      <Boxes size={22} color="var(--brand)" />
      <strong>{category.name}</strong>
      <span className="muted" style={{ fontSize: 13 }}>
        {category._count?.saas ?? 0} produtos
      </span>
      <ArrowRight size={15} style={{ float: 'right', marginTop: 12 }} />
    </Link>
  );
}
