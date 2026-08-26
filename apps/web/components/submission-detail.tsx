'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ExternalLink,
  ShieldAlert,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { clientApi, money } from '@/lib/api';
import { Saas } from '@/lib/types';
import { StatusBadge } from './status-badge';
type Item = Omit<Saas, 'owner' | 'reviews'> & {
  owner: { name: string; email: string };
  spamReviews?: {
    id: string;
    rating: number;
    comment: string;
    spamTerms?: string[];
    createdAt: string;
    user: { id: string; name: string; email: string };
  }[];
};
export function SubmissionDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { data: item } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => clientApi<Item>(`/admin/submissions/${id}`),
  });
  async function action(kind: 'approve' | 'reject') {
    try {
      await clientApi(`/admin/submissions/${id}/${kind}`, {
        method: 'POST',
        body: kind === 'reject' ? JSON.stringify({ reason }) : undefined,
      });
      toast.success(
        kind === 'approve' ? 'Produto aprovado' : 'Produto rejeitado',
      );
      router.push('/admin/submissions');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ação não concluída',
      );
    }
  }
  async function remove() {
    if (!item || deleteConfirmation !== item.name) return;
    try {
      await clientApi(`/admin/saas/${id}`, { method: 'DELETE' });
      toast.success('Produto excluído');
      await queryClient.invalidateQueries({ queryKey: ['submissions'] });
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      router.push('/admin/submissions');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível excluir',
      );
    }
  }
  async function removeReview(reviewId: string) {
    try {
      await clientApi(`/admin/reviews/${reviewId}`, { method: 'DELETE' });
      toast.success('Avaliação excluída');
      await queryClient.invalidateQueries({ queryKey: ['submission', id] });
      await queryClient.invalidateQueries({ queryKey: ['submissions'] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir a avaliação',
      );
    }
  }
  if (!item)
    return (
      <div className="skeleton" style={{ height: 360, borderRadius: 18 }} />
    );
  return (
    <div className="detail-grid">
      <article className="card stack" style={{ padding: 26 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <span className="eyebrow">
              {item.status === 'PENDING_REVIEW' && item.publishedAt
                ? 'Reaprovação'
                : 'Submissão'}
            </span>
            <h2>{item.name}</h2>
            {item.isAdult ? (
              <span className="pill" style={{ color: 'var(--danger)' }}>
                <ShieldAlert size={13} />
                Produto +18
              </span>
            ) : null}
          </div>
          <StatusBadge status={item.status} />
        </div>
        <p style={{ fontSize: 18 }}>{item.tagline}</p>
        <p className="muted">{item.description}</p>
        <dl className="two-col">
          <div>
            <dt className="muted">Maker</dt>
            <dd>
              {item.owner.name} · {item.owner.email}
            </dd>
          </div>
          <div>
            <dt className="muted">Preço</dt>
            <dd>{money(item.priceCents, item.currency)}</dd>
          </div>
        </dl>
        <a
          className="btn"
          href={item.websiteUrl}
          target="_blank"
          rel="noreferrer"
        >
          Verificar website <ExternalLink size={16} />
        </a>
        {item.spamReviews?.length ? (
          <section className="stack" style={{ marginTop: 10 }}>
            <div>
              <span className="eyebrow">Caixa de spam</span>
              <h3 style={{ margin: '6px 0 0' }}>
                Avaliações retidas automaticamente
              </h3>
              <p className="muted" style={{ margin: '6px 0 0' }}>
                Avaliações com palavras bloqueadas ficam escondidas do público.
                O admin pode apagar somente por esta caixa.
              </p>
            </div>
            {item.spamReviews.map((review) => (
              <article
                className="card stack"
                style={{ padding: 16 }}
                key={review.id}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <strong>{review.user.name}</strong>
                    <br />
                    <span className="muted" style={{ fontSize: 13 }}>
                      {review.user.email} ·{' '}
                      {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span className="pill">
                    <Star size={13} fill="currentColor" />
                    {review.rating}
                  </span>
                </div>
                {review.spamTerms?.length ? (
                  <div
                    className="notice"
                    style={{ fontSize: 13, padding: '10px 12px' }}
                  >
                    Termos detectados:{' '}
                    <strong>{review.spamTerms.join(', ')}</strong>
                  </div>
                ) : null}
                <p style={{ margin: 0 }}>{review.comment}</p>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', width: 'max-content' }}
                  type="button"
                  onClick={() => void removeReview(review.id)}
                >
                  <Trash2 size={15} />
                  Excluir avaliação
                </button>
              </article>
            ))}
          </section>
        ) : (
          <p className="muted" style={{ fontSize: 14 }}>
            Caixa de spam vazia. Nenhuma avaliação retida automaticamente.
          </p>
        )}
      </article>
      <aside className="card detail-aside">
        {item.status === 'PENDING_REVIEW' && (
          <>
            <h3>Decisão</h3>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => void action('approve')}
            >
              <Check size={17} />
              Aprovar
            </button>
            <label className="label" style={{ marginTop: 18 }}>
              Motivo da rejeição
              <textarea
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={5}
              />
            </label>
            <button
              className="btn"
              style={{ width: '100%', color: 'var(--danger)' }}
              disabled={reason.length < 5}
              onClick={() => void action('reject')}
            >
              <X size={17} />
              Rejeitar
            </button>
          </>
        )}
        <div
          style={{
            borderTop:
              item.status === 'PENDING_REVIEW'
                ? '1px solid var(--line)'
                : undefined,
            marginTop: item.status === 'PENDING_REVIEW' ? 22 : 0,
            paddingTop: item.status === 'PENDING_REVIEW' ? 20 : 0,
          }}
        >
          <h3>Excluir produto</h3>
          <p className="muted" style={{ fontSize: 14 }}>
            Esta ação remove o SaaS do catálogo e apaga dados relacionados como
            reviews, favoritos e analytics.
          </p>
          <label className="label">
            Digite {item.name} para confirmar
            <input
              className="input"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
            />
          </label>
          <button
            className="btn"
            style={{ width: '100%', color: 'var(--danger)', marginTop: 14 }}
            disabled={deleteConfirmation !== item.name}
            onClick={() => void remove()}
          >
            <Trash2 size={17} />
            Excluir SaaS
          </button>
        </div>
      </aside>
    </div>
  );
}
