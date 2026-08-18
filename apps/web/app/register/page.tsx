import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
export const metadata: Metadata = { title: 'Criar conta' };
export default function Register() {
  return (
    <div className="container" style={{ maxWidth: 500 }}>
      <header className="page-head">
        <span className="eyebrow">Comece agora</span>
        <h1>Publique o que você criou.</h1>
        <p className="muted">Uma conta, todos os seus produtos.</p>
      </header>
      <AuthForm mode="register" />
    </div>
  );
}
