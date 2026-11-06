"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "jc-stored-flag";

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * Boolean UI preference persisted in localStorage (per browser). Falls back to
 * `false` on the server and when storage is unavailable, so it never breaks
 * hydration.
 */
export function useStoredFlag(key: string): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(EVENT, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(EVENT, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => read(key),
    () => false,
  );

  const set = useCallback(
    (next: boolean) => {
      try {
        localStorage.setItem(key, next ? "1" : "0");
      } catch {}
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [value, set];
}
