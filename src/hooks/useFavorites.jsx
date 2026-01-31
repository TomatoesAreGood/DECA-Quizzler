import { useLocalStorage } from './useLocalStorage';

export function useFavorites() {
  const [favExams, setFavExams] = useLocalStorage('favExams', null);

  const isFavorite = (examName, questionNumber) => {
    if (!favExams || !favExams[examName]) return false;
    return favExams[examName].includes(questionNumber);
  };

  const toggleFavorite = (examName, questionNumber) => {
    // Read fresh data from localStorage to avoid stale state from multiple component instances
    const freshData = (() => {
      try {
        const item = window.localStorage.getItem('favExams');
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.log(error);
        return null;
      }
    })();

    const newFavs = freshData ? JSON.parse(JSON.stringify(freshData)) : {};
    // console.log('BEFORE:', JSON.parse(JSON.stringify(newFavs)));

    if (newFavs[examName]?.includes(questionNumber)) {
      // Use filter to create a new array instead of mutating with splice
      newFavs[examName] = newFavs[examName].filter(q => q !== questionNumber);
      if (newFavs[examName].length === 0) {
        delete newFavs[examName];
      }
    } else {
      // Use spread to create a new array instead of mutating with push
      if (newFavs[examName]) {
        newFavs[examName] = [...newFavs[examName], questionNumber];
      } else {
        newFavs[examName] = [questionNumber];
      }
    }

    // console.log('AFTER:', JSON.parse(JSON.stringify(newFavs)));
    const finalValue = Object.keys(newFavs).length > 0 ? newFavs : null;
    setFavExams(finalValue);
  };

  return { favExams, isFavorite, toggleFavorite };
}
