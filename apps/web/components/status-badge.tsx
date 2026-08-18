const labels: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING_PAYMENT: 'Aguardando pagamento',
  PENDING_REVIEW: 'Em análise',
  PUBLISHED: 'Publicado',
  REJECTED: 'Rejeitado',
  ARCHIVED: 'Arquivado',
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="pill"
      style={{
        color:
          status === 'PUBLISHED'
            ? 'var(--brand)'
            : status === 'REJECTED'
              ? 'var(--danger)'
              : undefined,
      }}
    >
      {labels[status] ?? status}
    </span>
  );
}
