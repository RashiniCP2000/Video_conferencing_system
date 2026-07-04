import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

const STORAGE_KEY = "videoconf_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("meetnova_theme") || "Light");

  // Propagate theme to document element on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("meetnova_theme") || "Light";
    document.documentElement.setAttribute("data-theme", savedTheme.toLowerCase());
  }, []);

  const changeTheme = useCallback((newTheme) => {
    localStorage.setItem("meetnova_theme", newTheme);
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme.toLowerCase());
  }, []);

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {}); // Fire and forget backend notification
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const loginWithToken = useCallback(async (newToken) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    const { data } = await api.get("/auth/me");
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      theme,
      changeTheme,
      isAuthenticated: Boolean(token),
      loginWithToken,
      logout,
      setUserFromBootstrap: setUser,
    }),
    [token, user, theme, changeTheme, loginWithToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
