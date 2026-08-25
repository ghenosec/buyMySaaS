import { ReviewsModeration } from '@/components/reviews-moderation';

export default function AdminReviews() {
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Moderação dedicada</span>
        <h1>Avaliações da comunidade.</h1>
        <p className="muted">
          Analise contexto, sinais automáticos e histórico antes de publicar.
        </p>
      </header>
      <ReviewsModeration />
    </div>
  );
}
