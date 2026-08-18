import type { Metadata } from 'next';
import { AuthForm } from '@/components/auth-form';
export const metadata: Metadata = { title: 'Entrar' };
export default function Login() {
  return (
    <div className="container" style={{ maxWidth: 500 }}>
      <header className="page-head">
        <span className="eyebrow">Sua conta</span>
        <h1>Bem-vindo de volta.</h1>
        <p className="muted">Gerencie seus produtos e acompanhe resultados.</p>
      </header>
      <AuthForm mode="login" />
    </div>
  );
}
