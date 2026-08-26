'use client';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { clientApi } from '@/lib/api';
import { Saas } from '@/lib/types';
export function PublicationReview({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: item } = useQuery({
    queryKey: ['saas-edit', id],
    queryFn: () => clientApi<Saas>(`/me/saas/${id}`),
  });
  async function submit() {
    setLoading(true);
    try {
      await clientApi(`/me/saas/${id}/submit`, { method: 'POST' });
      toast.success('Seu SaaS foi enviado para análise');
      router.push('/dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível enviar',
      );
    } finally {
      setLoading(false);
    }
  }
  if (!item)
    return (
      <div className="skeleton" style={{ height: 300, borderRadius: 18 }} />
    );
  return (
    <div className="detail-grid">
      <div className="stack">
        <section className="card" style={{ padding: 24 }}>
          <span className="eyebrow">Preview</span>
          <h2>{item.name}</h2>
          <p style={{ fontSize: 18 }}>{item.tagline}</p>
          <p className="muted">{item.shortDescription}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {item.categories?.map((c) => (
              <span className="pill" key={c.category.id}>
                {c.category.name}
              </span>
            ))}
          </div>
        </section>
        <section className="notice">
          <strong>
            <ShieldCheck
              size={17}
              style={{ display: 'inline', marginRight: 7 }}
            />
            O que acontece depois?
          </strong>
          <p>
            Seu SaaS será enviado gratuitamente para análise. Um administrador
            verifica conteúdo e links antes da publicação.
          </p>
        </section>
      </div>
      <aside className="card detail-aside">
        <span className="eyebrow">Publicação</span>
        <div style={{ fontSize: 32, fontWeight: 900, margin: '8px 0' }}>
          Grátis
        </div>
        <p className="muted">
          Seu anúncio passa por moderação antes de aparecer no catálogo. Não há
          taxa de publicação nem recursos pagos.
        </p>
        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={submit}
          disabled={loading}
        >
          <CheckCircle2 size={17} />
          {loading ? 'Enviando...' : 'Enviar para análise'}
        </button>
        <Link
          className="btn"
          style={{ width: '100%', marginTop: 9 }}
          href={`/dashboard/saas/${id}/edit`}
        >
          Voltar e editar
        </Link>
      </aside>
    </div>
  );
}
