import { useCallback, useState } from 'react';

// The setters keep the same identity between renders (like useState's), so they're safe to list in
// effect dependencies.
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue((prevStoredValue) => {
        const valueToStore = value instanceof Function ? value(prevStoredValue) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue((prevStoredValue) => {
        const valueToStore = value instanceof Function ? value(prevStoredValue) : value;
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  return [storedValue, setValue];
}
