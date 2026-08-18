import { PublicationReview } from '@/components/publication-review';
export default async function Review({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Última etapa</span>
        <h1>Revise seu SaaS.</h1>
        <p className="muted">
          Confira como o produto será apresentado antes de enviar.
        </p>
      </header>
      <PublicationReview id={id} />
    </>
  );
}
