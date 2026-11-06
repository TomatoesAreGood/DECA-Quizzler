import { useFavorites } from '../../hooks/useFavorites';

export function FavoriteButton({ examName, questionNumber }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(examName, questionNumber);
  const label = favorited ? 'Remove from favorites' : 'Add to favorites';

  const handleClick = () => {
    toggleFavorite(examName, questionNumber);
  };

  // The tooltip is plain CSS attached to the button. A Radix tooltip is placed with
  // viewport coordinates and lands in the wrong spot under the page's CSS zoom (see html in index.css).
  return (
    <button id="fav-btn" onClick={handleClick} aria-label={label} aria-pressed={favorited}>
      <div className="icon-stack">
        <i className="fa-solid fa-star bottom" style={{ color: favorited ? '#FFD700' : 'transparent' }}></i>
        <i className="fa-regular fa-star top" style={{ color: favorited ? '#FFD700' : 'var(--color-text-secondary)' }}></i>
      </div>
      <span className="fav-tooltip" role="tooltip">{label}</span>
    </button>
  );
}
