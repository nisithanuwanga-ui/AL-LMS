import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, getApiErrorMessage } from "../services/api";
import { getAuthStateAfterResponse } from "../auth/session";
import { useLanguage } from "./useLanguage";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [authError, setAuthError] = useState("");

  const restoreSession = useCallback(async (signal) => {
    try {
      const { data } = await apiRequest("/auth/me", { signal });
      if (signal?.aborted) return;
      if (!data?.user || typeof data.user.role !== "string") {
        throw new Error(t("auth.invalidAccountResponse"));
      }
      setUser(data.user);
      setStatus("authenticated");
    } catch (error) {
      if (signal?.aborted) return;
      if (error.status === 401) {
        setUser(null);
        setStatus("unauthenticated");
        setAuthError("");
        return;
      }
      if (error.status === 403) {
        setStatus((currentStatus) =>
          currentStatus === "loading" ? "error" : currentStatus,
        );
        setAuthError(getApiErrorMessage(error, t, t("auth.sessionError")));
        return;
      }
      setStatus((currentStatus) =>
        currentStatus === "authenticated" ? "authenticated" : "error",
      );
      setAuthError(getApiErrorMessage(error, t, t("auth.sessionError")));
    }
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();
    const handleAuthResponse = (event) => {
      if (event.statusCode === 401) {
        setUser((currentUser) =>
          getAuthStateAfterResponse(
            { user: currentUser, status: "authenticated" },
            event.statusCode,
          ).user,
        );
        setStatus("unauthenticated");
        setAuthError("");
      }
    };

    window.addEventListener("nisova:auth-response", handleAuthResponse);
    const restoreTimer = window.setTimeout(
      () => restoreSession(controller.signal),
      0,
    );

    return () => {
      window.clearTimeout(restoreTimer);
      controller.abort();
      window.removeEventListener("nisova:auth-response", handleAuthResponse);
    };
  }, [restoreSession]);

  const login = useCallback(async (credentials) => {
    const { data } = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    if (!data?.user || typeof data.user.role !== "string") {
      throw new Error(t("auth.invalidLoginResponse"));
    }
    setUser(data.user);
    setStatus("authenticated");
    setAuthError("");
    return data.user;
  }, [t]);

  const register = useCallback(async (role, details) => {
    const endpoint = role === "teacher" ? "teacher" : "student";
    const { data } = await apiRequest(`/auth/register/${endpoint}`, {
      method: "POST",
      body: JSON.stringify(details),
    });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      setAuthError("");
    }
  }, []);

  const refreshSession = useCallback(() => {
    setStatus("loading");
    setAuthError("");
    return restoreSession();
  }, [restoreSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      authError,
      login,
      logout,
      register,
      refreshSession,
    }),
    [user, status, authError, login, logout, register, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
