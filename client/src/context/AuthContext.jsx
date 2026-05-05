import { createContext, useCallback, useContext, useMemo, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "videoconf_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const loginWithToken = useCallback(async (newToken) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    const { data } = await api.get("/auth/me");
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loginWithToken,
      logout,
      setUserFromBootstrap: setUser,
    }),
    [token, user, loginWithToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
