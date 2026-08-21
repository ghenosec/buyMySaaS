'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { clientApi } from '@/lib/api';
import { User } from '@/lib/types';
import { EmptyState } from './empty-state';

type AdminUser = User & {
  createdAt: string;
  _count?: { saas: number; reviews: number };
};

export function UsersPermissions() {
  const queryClient = useQueryClient();
  const { data = [], error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => clientApi<AdminUser[]>('/admin/users'),
  });
  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: User['role'] }) =>
      clientApi<AdminUser>(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    onSuccess: async () => {
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

  if (!data.length)
    return (
      <EmptyState
        title="Nenhum usuário encontrado"
        description="Quando novas contas forem criadas, elas aparecerão aqui."
      />
    );

  return (
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
                <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <button
                    className="btn btn-sm"
                    disabled={mutation.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Confirmar alteração de ${user.email} para ${nextRole}?`,
                      );
                      if (!confirmed) return;
                      mutation.mutate({ id: user.id, role: nextRole });
                    }}
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
  );
}
