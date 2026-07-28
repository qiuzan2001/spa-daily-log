"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoSave<T>(
  key: string,
  data: T,
  intervalMs: number = 5000
) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const prevDataRef = useRef<T>(data);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveNow = useCallback(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      prevDataRef.current = data;
      setLastSaved(new Date());
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  }, [key, data]);

  const loadSaved = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored) as T;
    } catch {
      // ignore
    }
    return null;
  }, [key]);

  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      // Only save if data changed
      if (JSON.stringify(prevDataRef.current) !== JSON.stringify(data)) {
        saveNow();
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data, intervalMs, saveNow]);

  return { lastSaved, saveNow, loadSaved, clearSaved };
}