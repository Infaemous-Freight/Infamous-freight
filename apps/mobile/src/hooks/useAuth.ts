import { useEffect, useState } from "react";

interface AuthState {
  token: string | null;
  userId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Manages the local authentication token state for the mobile app.
 *
 * Usage:
 *   const { token, userId, isLoading, isAuthenticated } = useAuth();
 */
export function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Token retrieval is intentionally async-aware; integrators should
    // replace this stub with their secure-storage implementation.
    const loadToken = async () => {
      try {
        // TODO: Replace this stub with your secure-storage implementation,
        // e.g. `SecureStore.getItemAsync('auth')` (Expo) or AsyncStorage.
        // The stored value format is expected to be "<userId>:<jwt>".
        const stored: string | null = null;
        if (stored) {
          const [id, jwt] = stored.split(":");
          setUserId(id);
          setToken(jwt);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadToken();
  }, []);

  return {
    token,
    userId,
    isLoading,
    isAuthenticated: token !== null,
  };
}
