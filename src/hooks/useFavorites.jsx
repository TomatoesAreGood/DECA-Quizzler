import { useLocalStorage } from './useLocalStorage';

export function useFavorites() {
  const [favExams, setFavExams] = useLocalStorage('favExams', null);

  const isFavorite = (examName, questionNumber) => {
    if (!favExams || !favExams[examName]) return false;
    return favExams[examName].includes(questionNumber);
  };

  const toggleFavorite = (examName, questionNumber) => {
    setFavExams((prevFavs) => {
      const newFavs = prevFavs ? { ...prevFavs } : {};

      if (newFavs[examName]?.includes(questionNumber)) {
        const index = newFavs[examName].indexOf(questionNumber);
        newFavs[examName].splice(index, 1);
        if (newFavs[examName].length === 0) {
          delete newFavs[examName];
        }
      } else {
        if (newFavs[examName]) {
          newFavs[examName].push(questionNumber);
        } else {
          newFavs[examName] = [questionNumber];
        }
      }

      return Object.keys(newFavs).length > 0 ? newFavs : null;
    });
  };

  return { favExams, isFavorite, toggleFavorite };
}
