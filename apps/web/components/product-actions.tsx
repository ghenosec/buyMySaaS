'use client';
import { Heart, Rocket, Send, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { clientApi } from '@/lib/api';

export function PageView({ saasId }: { saasId: string }) {
  useEffect(() => {
    void clientApi('/analytics/event', {
      method: 'POST',
      body: JSON.stringify({
        saasId,
        type: 'PAGE_VIEW',
        referrer: document.referrer || undefined,
      }),
    }).catch(() => undefined);
  }, [saasId]);
  return null;
}
export function FavoriteButton({ saasId }: { saasId: string }) {
  const [active, setActive] = useState(false);
  async function toggle() {
    try {
      await clientApi(`/saas/${saasId}/favorite`, {
        method: active ? 'DELETE' : 'POST',
      });
      setActive(!active);
      toast.success(
        active ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Faça login para favoritar',
      );
    }
  }
  return (
    <button
      className="btn"
      style={{ width: '100%' }}
      type="button"
      onClick={toggle}
      aria-pressed={active}
    >
      <Heart size={17} fill={active ? 'currentColor' : 'none'} />
      {active ? 'Favoritado' : 'Favoritar'}
    </button>
  );
}
export function BoostButton({
  saasId,
  initialBoosts = 0,
}: {
  saasId: string;
  initialBoosts?: number;
}) {
  const [boosted, setBoosted] = useState(false);
  const [boosts, setBoosts] = useState(initialBoosts);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    void clientApi<{ boosted: boolean; boosts: number }>(
      `/saas/${saasId}/boost`,
    )
      .then((result) => {
        setBoosted(result.boosted);
        setBoosts(result.boosts);
      })
      .catch(() => undefined);
  }, [saasId]);
  async function boost() {
    setLoading(true);
    try {
      const result = await clientApi<{ boosted: boolean; boosts: number }>(
        `/saas/${saasId}/boost`,
        { method: 'POST' },
      );
      setBoosted(result.boosted);
      setBoosts(result.boosts);
      toast.success('Boost registrado. Esse SaaS ganhou força no Em alta.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Faça login para impulsionar',
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <button
      className="btn"
      style={{ width: '100%' }}
      type="button"
      onClick={boost}
      disabled={boosted || loading}
      aria-pressed={boosted}
    >
      <Rocket size={17} fill={boosted ? 'currentColor' : 'none'} />
      {loading
        ? 'Impulsionando...'
        : boosted
          ? `Impulsionado (${boosts})`
          : `Impulsionar (${boosts})`}
    </button>
  );
}
export function ReviewForm({ saasId }: { saasId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await clientApi<{ spam?: boolean }>(
        `/saas/${saasId}/reviews`,
        {
          method: 'POST',
          body: JSON.stringify({ rating, comment }),
        },
      );
      toast.success(
        result.spam
          ? 'Avaliação recebida e enviada para moderação'
          : 'Avaliação publicada',
      );
      setComment('');
      location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível avaliar',
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={submit} className="card stack" style={{ padding: 20 }}>
      <strong>Conte como foi sua experiência</strong>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            type="button"
            aria-label={`${value} estrelas`}
            key={value}
            onClick={() => setRating(value)}
            style={{
              border: 0,
              background: 'transparent',
              color: value <= rating ? '#e6a600' : 'var(--line)',
              padding: 2,
            }}
          >
            <Star size={24} fill="currentColor" />
          </button>
        ))}
      </div>
      <textarea
        className="input"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        minLength={3}
        maxLength={1200}
        placeholder="O que funcionou bem? Para quem você recomenda?"
      />
      <button className="btn btn-primary" disabled={loading}>
        <Send size={16} />
        {loading ? 'Publicando...' : 'Publicar avaliação'}
      </button>
    </form>
  );
}
