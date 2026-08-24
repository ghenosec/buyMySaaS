import { ArrowRight } from 'lucide-react';
import { browserApiUrl } from '@/lib/api';

export function AuthForm({ mode }: { mode?: 'login' | 'register' }) {
  void mode;
  return (
    <div className="card stack" style={{ padding: 26 }}>
      <a className="btn btn-primary" href={`${browserApiUrl}/auth/google`}>
        Continuar com Google
        <ArrowRight size={17} />
      </a>
      <p className="muted" style={{ margin: 0 }}>
        O acesso é feito exclusivamente com uma conta Google. Assim evitamos
        senha local e centralizamos a autenticação em um provedor seguro.
      </p>
    </div>
  );
}
