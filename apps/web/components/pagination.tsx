import Link from 'next/link';
export function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (next: number) =>
    `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(next) } as Record<string, string>)}`;
  return (
    <nav
      aria-label="Paginação"
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        marginTop: 28,
      }}
    >
      <Link
        className="btn btn-sm"
        aria-disabled={page <= 1}
        href={href(Math.max(1, page - 1))}
      >
        Anterior
      </Link>
      <span className="pill">
        {page} de {totalPages}
      </span>
      <Link
        className="btn btn-sm"
        aria-disabled={page >= totalPages}
        href={href(Math.min(totalPages, page + 1))}
      >
        Próxima
      </Link>
    </nav>
  );
}
