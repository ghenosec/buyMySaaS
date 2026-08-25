import { Search } from 'lucide-react';
export function SearchBar({
  defaultValue = '',
  compact = false,
}: {
  defaultValue?: string;
  compact?: boolean;
}) {
  return (
    <form
      action="/explore"
      className={compact ? '' : 'hero-search'}
      style={compact ? { display: 'flex', gap: 8 } : undefined}
    >
      <input type="hidden" name="sort" value="relevance" />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <Search size={19} className="muted" />
        <span className="sr-only">Buscar</span>
        <input
          className="input"
          name="search"
          defaultValue={defaultValue}
          placeholder="Busque por produto, categoria ou problema..."
        />
      </label>
      <button className="btn btn-primary" type="submit">
        Buscar
      </button>
    </form>
  );
}
