import { FavoritesList } from '@/components/favorites-list';
export default function Favorites() {
  return (
    <>
      <header className="page-head">
        <span className="eyebrow">Sua coleção</span>
        <h1>Favoritos.</h1>
      </header>
      <FavoritesList />
    </>
  );
}
