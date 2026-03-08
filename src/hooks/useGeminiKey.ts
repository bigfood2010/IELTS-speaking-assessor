import { useState, useCallback } from 'react';

const STORAGE_KEY = 'GEMINI_USER_API_KEY';

export function useGeminiKey() {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const saveKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      localStorage.removeItem(STORAGE_KEY);
      setApiKey(null);
    } else {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setApiKey(trimmed);
    }
  }, []);

  const removeKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
  }, []);

  return { apiKey, saveKey, removeKey, hasKey: !!apiKey };
}
