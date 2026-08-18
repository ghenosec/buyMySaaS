import { AnalyticsChart } from '@/components/analytics-chart';
export default async function Analytics({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Performance</span>
        <h1>Analytics.</h1>
        <p className="muted">
          Sinais simples para entender o que desperta interesse.
        </p>
      </header>
      <AnalyticsChart id={id} />
    </>
  );
}
