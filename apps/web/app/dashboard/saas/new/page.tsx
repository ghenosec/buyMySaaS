import { SaasForm } from '@/components/saas-form';
import { RequireGoogleLogin } from '@/components/require-google-login';
export default function NewSaas() {
  return (
    <RequireGoogleLogin>
      <header className="page-head">
        <span className="eyebrow">Novo produto</span>
        <h1>Publique seu SaaS.</h1>
        <p className="muted">Você poderá revisar tudo antes de enviar.</p>
      </header>
      <SaasForm />
    </RequireGoogleLogin>
  );
}
