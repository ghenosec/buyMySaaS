import Image from 'next/image';
import Link from 'next/link';
import { PublishSaasLink } from './publish-saas-link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              style={{ width: 28, height: 28, objectFit: 'contain' }}
            />
            <strong style={{ color: 'var(--text)' }}>Buy My SaaS</strong>
          </div>
          <p>Produtos independentes merecem ser descobertos.</p>
          <p style={{ marginBottom: 0 }}>
            © {new Date().getFullYear()} Buy My SaaS. Desenvolvido por{' '}
            <a
              href="https://github.com/ghenosec"
              target="_blank"
              rel="noreferrer"
            >
              ghenosec
            </a>
            .
          </p>
        </div>
        <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link href="/explore">Explorar</Link>
          <PublishSaasLink className="nav-link" showIcon={false}>
            Publicar
          </PublishSaasLink>
          <Link href="/privacy">Privacidade</Link>
          <Link href="/terms">Termos</Link>
        </nav>
      </div>
    </footer>
  );
}
