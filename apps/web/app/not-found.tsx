import { SearchX } from 'lucide-react';
import Link from 'next/link';
export default function NotFound() {
  return (
    <div
      className="container"
      style={{ textAlign: 'center', padding: '100px 0' }}
    >
      <SearchX size={48} style={{ margin: 'auto', color: 'var(--brand)' }} />
      <h1 style={{ fontSize: 54, letterSpacing: '-.05em' }}>
        Página não encontrada.
      </h1>
      <p className="muted">
        O endereço mudou ou este produto ainda não foi publicado.
      </p>
      <Link className="btn btn-primary" href="/explore">
        Explorar SaaS
      </Link>
    </div>
  );
}
