import * as Tooltip from '@radix-ui/react-tooltip';
import { useFavorites } from '../../hooks/useFavorites';

export function FavoriteButton({ examName, questionNumber }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(examName, questionNumber);

  const handleClick = () => {
    toggleFavorite(examName, questionNumber);
  };

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button id="fav-btn" onClick={handleClick}>
            <div className="icon-stack">
              <i className="fa-solid fa-star bottom" style={{ color: favorited ? '#FFD700' : 'transparent' }}></i>
              <i className="fa-regular fa-star top" style={{ color: favorited ? '#FFD700' : '#5A6A7A' }}></i>
            </div>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="tooltip-content" sideOffset={5}>
            {favorited ? 'Remove from favorites' : 'Add to favorites'}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
