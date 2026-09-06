import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../hooks/useAuth";
import * as authService from "../services/authService";
import { clearSession, getAccessToken, onAuthChange } from "../services/authSession";

/**
 * Auth state machine: 'restoring' | 'authenticated' | 'unauthenticated'.
 *
 * - On mount the session is restored via the backend refresh cookie
 *   (never from localStorage — no token ever persists client-side).
 * - Subscribes to the shared auth-session store so transparent 401
 *   recoveries inside apiClient keep this context in sync.
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState("restoring");
  // Ref mirror so logout always reads the latest token without re-binding.
  const adminRef = useRef(admin);
  adminRef.current = admin;

  useEffect(() => {
    let cancelled = false;

    authService
      .restoreSession()
      .then((data) => {
        if (cancelled) return;
        setAdmin(data.admin);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setAdmin(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange((session) => {
      if (session) {
        setAdmin((prev) => session.admin || prev);
        setStatus("authenticated");
      } else {
        setAdmin(null);
        setStatus("unauthenticated");
      }
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authService.login({ email, password });
    // The apiClient/authSession store already holds the token after the
    // login response; persist the admin identity here.
    setAdmin(data.admin);
    setStatus("authenticated");
    return data.admin;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAdmin(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({
      admin,
      status,
      isAuthenticated: status === "authenticated",
      hasSessionToken: () => Boolean(getAccessToken()),
      login,
      logout,
    }),
    [admin, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
