import { PackageOpen } from 'lucide-react';
import Link from 'next/link';
export function EmptyState({
  title = 'Nada por aqui ainda',
  description = 'Tente ajustar os filtros ou volte em breve.',
  actionHref,
  actionLabel,
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '54px 24px' }}>
      <PackageOpen
        size={34}
        style={{ margin: '0 auto 14px', color: 'var(--brand)' }}
      />
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {actionHref && (
        <Link className="btn btn-primary" href={actionHref}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
