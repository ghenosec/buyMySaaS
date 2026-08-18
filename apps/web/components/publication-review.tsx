'use client';
import {
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { clientApi, money } from '@/lib/api';
import { Saas } from '@/lib/types';
type Config = {
  publicationFeeEnabled: boolean;
  publicationFeeCents: number;
  publicationFeeCurrency: string;
};
export function PublicationReview({ id }: { id: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { data: item } = useQuery({
    queryKey: ['saas-edit', id],
    queryFn: () => clientApi<Saas>(`/me/saas/${id}`),
  });
  const { data: config } = useQuery({
    queryKey: ['public-config'],
    queryFn: () => clientApi<Config>('/config/public'),
  });
  const order = search.get('order');
  async function submit() {
    setLoading(true);
    try {
      const result = await clientApi<{
        requiresPayment: boolean;
        checkoutUrl?: string;
      }>(`/me/saas/${id}/submit`, { method: 'POST' });
      if (result.requiresPayment && result.checkoutUrl)
        location.href = result.checkoutUrl;
      else {
        toast.success('Seu SaaS foi enviado para análise');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível enviar',
      );
    } finally {
      setLoading(false);
    }
  }
  async function confirm() {
    if (!order) return;
    setLoading(true);
    try {
      await clientApi(`/payments/mock/${order}/confirm`, { method: 'POST' });
      toast.success('Pagamento mock confirmado');
      router.push('/dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Falha na confirmação',
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
            Após {config?.publicationFeeEnabled ? 'o pagamento, ' : ''}seu SaaS
            será enviado para análise. Um administrador verifica conteúdo e
            links antes da publicação.
          </p>
        </section>
      </div>
      <aside className="card detail-aside">
        <span className="eyebrow">Taxa de publicação</span>
        <div style={{ fontSize: 32, fontWeight: 900, margin: '8px 0' }}>
          {config?.publicationFeeEnabled
            ? money(config.publicationFeeCents, config.publicationFeeCurrency)
            : 'Grátis no lançamento'}
        </div>
        <p className="muted">
          Pagamento único por anúncio. O Buy My SaaS não cobra comissão sobre
          suas vendas.
        </p>
        {order ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={confirm}
            disabled={loading}
          >
            <CheckCircle2 size={17} />
            Confirmar pagamento mock
          </button>
        ) : (
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={submit}
            disabled={loading}
          >
            <CreditCard size={17} />
            {loading
              ? 'Enviando...'
              : config?.publicationFeeEnabled
                ? 'Pagar e enviar'
                : 'Enviar para análise'}
          </button>
        )}
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
