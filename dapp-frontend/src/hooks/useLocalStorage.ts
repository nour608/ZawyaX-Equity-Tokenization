import { useState, useEffect } from "react";

/**
 * Custom hook for managing localStorage with type safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook for managing boolean localStorage values (like theme, feature flags)
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useLocalStorage(key, initialValue);

  const toggle = () => setValue(!value);
  const set = (newValue: boolean) => setValue(newValue);

  return [value, toggle, set];
}

/**
 * Hook for managing object localStorage values with partial updates
 */
export function useLocalStorageObject<T extends Record<string, unknown>>(
  key: string,
  initialValue: T
): [T, (updates: Partial<T>) => void, (value: T) => void] {
  const [value, setValue] = useLocalStorage(key, initialValue);

  const updateValue = (updates: Partial<T>) => {
    setValue((prev) => ({ ...prev, ...updates }));
  };

  const resetValue = (newValue: T) => setValue(newValue);

  return [value, updateValue, resetValue];
}