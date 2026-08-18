'use client';
import { Heart, Send, Star } from 'lucide-react';
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
    <button className="btn" onClick={toggle} aria-pressed={active}>
      <Heart size={17} fill={active ? 'currentColor' : 'none'} />
      {active ? 'Favoritado' : 'Favoritar'}
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
      await clientApi(`/saas/${saasId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
      toast.success('Avaliação publicada');
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
