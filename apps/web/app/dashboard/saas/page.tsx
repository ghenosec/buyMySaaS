import { Plus } from 'lucide-react';
import Link from 'next/link';
import { MySaasList } from '@/components/my-saas-list';
export default function MySaas() {
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Seu catálogo</span>
        <h1>Meus SaaS.</h1>
        <Link className="btn btn-primary" href="/dashboard/saas/new">
          <Plus size={16} />
          Novo SaaS
        </Link>
      </header>
      <MySaasList />
    </>
  );
}
