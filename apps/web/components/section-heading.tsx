import Link from 'next/link';
export function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && (
          <p className="muted" style={{ margin: '7px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>
      {href && (
        <Link className="nav-link" href={href}>
          Ver todos →
        </Link>
      )}
    </div>
  );
}
