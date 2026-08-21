'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Shield, ShieldOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { clientApi } from '@/lib/api';
import { User } from '@/lib/types';
import { EmptyState } from './empty-state';

type AdminUser = User & {
  createdAt: string;
  _count?: { saas: number; reviews: number };
};

export function UsersPermissions() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: AdminUser;
    nextRole: User['role'];
  } | null>(null);
  const queryClient = useQueryClient();
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);
  const { data = [], error } = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () =>
      clientApi<AdminUser[]>(
        `/admin/users${
          debouncedSearch
            ? `?search=${encodeURIComponent(debouncedSearch)}`
            : ''
        }`,
      ),
  });
  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) =>
      clientApi<AdminUser>(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: async () => {
      setPendingRoleChange(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Permissão atualizada');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a permissão',
      );
    },
  });

  if (error)
    return (
      <div className="notice error">
        Você precisa entrar com uma conta administradora.
      </div>
    );

  return (
    <div className="stack">
      <div className="card" style={{ padding: 16 }}>
        <label className="label">
          Buscar usuário
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={16}
                color="var(--muted)"
                style={{
                  left: 13,
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                className="input"
                placeholder="Digite nome ou email"
                style={{ paddingLeft: 38 }}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {search ? (
              <button
                className="btn"
                type="button"
                onClick={() => setSearch('')}
              >
                <X size={16} />
                Limpar
              </button>
            ) : null}
          </div>
          <span className="muted">
            {debouncedSearch
              ? `Resultados para “${debouncedSearch}”.`
              : 'Mostrando até 100 usuários mais recentes.'}
          </span>
        </label>
      </div>
      {pendingRoleChange ? (
        <div
          className="card"
          role="status"
          style={{
            borderColor:
              pendingRoleChange.nextRole === 'ADMIN'
                ? 'var(--brand)'
                : 'var(--danger)',
            padding: 18,
          }}
        >
          <div className="section-title" style={{ marginBottom: 0 }}>
            <div>
              <span className="eyebrow">Confirmação</span>
              <h2 style={{ fontSize: 22 }}>
                {pendingRoleChange.nextRole === 'ADMIN'
                  ? 'Tornar usuário administrador?'
                  : 'Remover permissão de administrador?'}
              </h2>
              <p className="muted" style={{ marginBottom: 0 }}>
                {pendingRoleChange.user.name} ({pendingRoleChange.user.email})
                será alterado para{' '}
                <strong>
                  {pendingRoleChange.nextRole === 'ADMIN'
                    ? 'Administrador'
                    : 'Usuário'}
                </strong>
                .
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn"
                type="button"
                disabled={mutation.isPending}
                onClick={() => setPendingRoleChange(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    id: pendingRoleChange.user.id,
                    role: pendingRoleChange.nextRole,
                  })
                }
              >
                {mutation.isPending ? 'Atualizando...' : 'Confirmar alteração'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {!data.length ? (
        <EmptyState
          title={
            debouncedSearch
              ? 'Nenhum usuário encontrado'
              : 'Nenhum usuário cadastrado'
          }
          description={
            debouncedSearch
              ? 'Tente buscar por outro nome ou email.'
              : 'Quando novas contas forem criadas, elas aparecerão aqui.'
          }
        />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Permissão</th>
                <th>Produtos</th>
                <th>Avaliações</th>
                <th>Criado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((user) => {
                const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
                const action =
                  user.role === 'ADMIN' ? 'Remover admin' : 'Tornar admin';
                return (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <br />
                      <span className="muted">{user.email}</span>
                    </td>
                    <td>
                      <span className="pill">
                        {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td>{user._count?.saas ?? 0}</td>
                    <td>{user._count?.reviews ?? 0}</td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        disabled={mutation.isPending}
                        onClick={() => setPendingRoleChange({ user, nextRole })}
                      >
                        {user.role === 'ADMIN' ? (
                          <ShieldOff size={15} />
                        ) : (
                          <Shield size={15} />
                        )}
                        {action}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
