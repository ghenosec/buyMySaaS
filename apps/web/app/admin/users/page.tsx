import { UsersPermissions } from '@/components/users-permissions';

export default function AdminUsers() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Permissões</span>
        <h1>Usuários.</h1>
        <p className="muted">
          Promova contas normais para administradores ou remova permissões
          quando necessário.
        </p>
      </header>
      <UsersPermissions />
    </div>
  );
}
