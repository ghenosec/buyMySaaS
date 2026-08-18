import Link from 'next/link';
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <strong style={{ color: 'var(--text)' }}>Buy My SaaS</strong>
          <p>Produtos independentes merecem ser descobertos.</p>
        </div>
        <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link href="/explore">Explorar</Link>
          <Link href="/dashboard/saas/new">Publicar</Link>
          <Link href="/privacy">Privacidade</Link>
          <Link href="/terms">Termos</Link>
        </nav>
      </div>
    </footer>
  );
}
