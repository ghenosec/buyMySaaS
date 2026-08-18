import { Heart, LayoutDashboard, Package, Plus } from 'lucide-react';
import Link from 'next/link';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="container dashboard-shell"
      style={{
        display: 'grid',
        gridTemplateColumns: '220px minmax(0,1fr)',
        gap: 28,
        paddingTop: 32,
      }}
    >
      <aside
        className="card dashboard-nav"
        style={{
          padding: 14,
          height: 'max-content',
          position: 'sticky',
          top: 88,
        }}
      >
        <nav className="stack" style={{ gap: 6 }}>
          <Link
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start' }}
            href="/dashboard"
          >
            <LayoutDashboard size={17} />
            Visão geral
          </Link>
          <Link
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start' }}
            href="/dashboard/saas"
          >
            <Package size={17} />
            Meus SaaS
          </Link>
          <Link
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start' }}
            href="/dashboard/favorites"
          >
            <Heart size={17} />
            Favoritos
          </Link>
          <Link
            className="btn btn-primary"
            style={{ justifyContent: 'flex-start' }}
            href="/dashboard/saas/new"
          >
            <Plus size={17} />
            Novo SaaS
          </Link>
        </nav>
      </aside>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}
