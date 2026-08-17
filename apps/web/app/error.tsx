'use client';
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="container"
      style={{ textAlign: 'center', padding: '100px 0' }}
    >
      <h1>Algo não saiu como esperado.</h1>
      <p className="muted">Tente novamente. Seus dados permanecem seguros.</p>
      <button className="btn btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
