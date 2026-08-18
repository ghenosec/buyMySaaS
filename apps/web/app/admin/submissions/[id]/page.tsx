import { SubmissionDetail } from '@/components/submission-detail';
export default async function Submission({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Análise completa</span>
        <h1>Revisar submissão.</h1>
      </header>
      <SubmissionDetail id={id} />
    </div>
  );
}
