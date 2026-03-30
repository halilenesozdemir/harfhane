import { useState, useEffect, useCallback, useRef } from 'react';

function readStorage<T>(key: string, initialValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) as T : initialValue;
  } catch {
    return initialValue;
  }
}

export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => readStorage(key, initialValue));
  const keyRef = useRef(key);

  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    setStoredValue(readStorage(key, initialValue));
  }, [key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)): void => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(keyRef.current, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch {
      // silent fail
    }
  }, []);

  return [storedValue, setValue];
};

export default useLocalStorage;
