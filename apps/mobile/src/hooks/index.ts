import { useState, useEffect, useCallback } from "react";

/**
 * Returns whether the app is currently in an offline state.
 * Extend with NetInfo or Expo NetInfo for real connectivity detection.
 */
export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Placeholder: integrate with @react-native-community/netinfo for real detection
    setIsOffline(false);
  }, []);

  return isOffline;
}

/**
 * Simple boolean toggle hook.
 */
export function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}
