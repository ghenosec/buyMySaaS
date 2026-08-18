import { AdminDashboard } from '@/components/admin-dashboard';
export default function Admin() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Administração</span>
        <h1>Moderação e saúde.</h1>
        <p className="muted">
          Uma fila clara para manter a qualidade do catálogo.
        </p>
      </header>
      <AdminDashboard />
    </div>
  );
}
