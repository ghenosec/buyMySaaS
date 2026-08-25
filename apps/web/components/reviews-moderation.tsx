'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Search, ShieldAlert, Star, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { clientApi } from '@/lib/api';
import { Paginated } from '@/lib/types';
import { EmptyState } from './empty-state';

type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type ModerationReview = {
  id: string;
  rating: number;
  comment: string;
  spam: boolean;
  spamTerms: string[];
  moderationStatus: ModerationStatus;
  moderationReason?: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  saas: { id: string; name: string; slug: string };
};

export function ReviewsModeration() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ModerationStatus>('PENDING');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const params = new URLSearchParams({ status, page: String(page) });
  if (search) params.set('search', search);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', status, search, page],
    queryFn: () =>
      clientApi<Paginated<ModerationReview>>(`/admin/reviews?${params}`),
  });
  const action = useMutation({
    mutationFn: async ({
      id,
      kind,
    }: {
      id: string;
      kind: 'approve' | 'reject' | 'delete';
    }) => {
      if (kind === 'delete')
        return clientApi(`/admin/reviews/${id}`, { method: 'DELETE' });
      return clientApi(`/admin/reviews/${id}/${kind}`, {
        method: 'POST',
        body:
          kind === 'reject'
            ? JSON.stringify({ reason: reasons[id]?.trim() })
            : undefined,
      });
    },
    onSuccess: async (_, variables) => {
      toast.success(
        variables.kind === 'approve'
          ? 'Avaliação aprovada'
          : variables.kind === 'reject'
            ? 'Avaliação rejeitada'
            : 'Avaliação excluída',
      );
      await queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Ação não concluída',
      ),
  });
  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }
  const items = data?.data ?? [];
  return (
    <div className="stack">
      <section className="card" style={{ padding: 16 }}>
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((value) => (
              <button
                className={
                  status === value ? 'btn btn-primary btn-sm' : 'btn btn-sm'
                }
                key={value}
                type="button"
                onClick={() => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                {value === 'PENDING'
                  ? 'Pendentes'
                  : value === 'APPROVED'
                    ? 'Aprovadas'
                    : 'Rejeitadas'}
              </button>
            ))}
          </div>
          <form onSubmit={submitSearch} style={{ display: 'flex', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Search size={17} className="muted" />
              <span className="sr-only">Buscar avaliações</span>
              <input
                className="input"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Texto, usuário ou produto"
              />
            </label>
            <button className="btn btn-sm">Buscar</button>
          </form>
        </div>
      </section>

      {isLoading ? (
        <div className="skeleton" style={{ height: 280, borderRadius: 18 }} />
      ) : items.length ? (
        <div className="stack">
          {items.map((review) => (
            <article
              className="card stack"
              style={{ padding: 20 }}
              key={review.id}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <strong>{review.user.name}</strong>{' '}
                  <span className="muted">· {review.user.email}</span>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Em{' '}
                    <Link href={`/saas/${review.saas.slug}`}>
                      {review.saas.name}
                    </Link>{' '}
                    · {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className="pill">
                  <Star size={13} fill="currentColor" /> {review.rating}
                </span>
              </div>
              {review.spam ? (
                <div className="notice" style={{ color: 'var(--danger)' }}>
                  <ShieldAlert size={16} /> Sinalizada automaticamente
                  {review.spamTerms.length
                    ? `: ${review.spamTerms.join(', ')}`
                    : ''}
                </div>
              ) : null}
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {review.comment}
              </p>
              {status === 'REJECTED' && review.moderationReason ? (
                <p className="muted" style={{ margin: 0 }}>
                  Motivo: {review.moderationReason}
                </p>
              ) : null}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {status === 'PENDING' ? (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={action.isPending}
                      onClick={() =>
                        action.mutate({ id: review.id, kind: 'approve' })
                      }
                    >
                      <Check size={15} /> Aprovar
                    </button>
                    <input
                      className="input"
                      style={{ flex: '1 1 240px' }}
                      minLength={5}
                      maxLength={500}
                      value={reasons[review.id] ?? ''}
                      onChange={(event) =>
                        setReasons((current) => ({
                          ...current,
                          [review.id]: event.target.value,
                        }))
                      }
                      placeholder="Motivo para rejeitar (mín. 5 caracteres)"
                    />
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--danger)' }}
                      disabled={
                        action.isPending ||
                        (reasons[review.id]?.trim().length ?? 0) < 5
                      }
                      onClick={() =>
                        action.mutate({ id: review.id, kind: 'reject' })
                      }
                    >
                      <X size={15} /> Rejeitar
                    </button>
                  </>
                ) : null}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)' }}
                  disabled={action.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        'Excluir esta avaliação permanentemente? Esta ação não pode ser desfeita.',
                      )
                    )
                      action.mutate({ id: review.id, kind: 'delete' });
                  }}
                >
                  <Trash2 size={15} /> Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Fila em dia"
          description="Nenhuma avaliação encontrada neste estado."
        />
      )}

      {(data?.meta.totalPages ?? 0) > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </button>
          <span className="pill">
            {page} de {data?.meta.totalPages}
          </span>
          <button
            className="btn btn-sm"
            disabled={page >= (data?.meta.totalPages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </button>
        </div>
      ) : null}
    </div>
  );
}
