import { SaasForm } from '@/components/saas-form';
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Editar produto</span>
        <h1>Ajuste os detalhes.</h1>
      </header>
      <SaasForm id={id} />
    </>
  );
}
