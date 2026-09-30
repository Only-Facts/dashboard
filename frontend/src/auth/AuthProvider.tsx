import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, login, logout } from "../api/authApi";
import type { LoginRequest, User } from "../types/auth";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setUser(await getCurrentUser());
    } catch (err) {
      setUser(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => active && setUser(currentUser))
      .catch((err: unknown) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  async function signIn(request: LoginRequest) {
    setUser(await login(request));
    setError(null);
  }

  async function signOut() {
    await logout();
    setUser(null);
    setError(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to check authentication.";
}
