import React, { createContext, useContext, useEffect, useState } from "react";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; adminId: number; displayName: string }
  | { status: "unauthenticated" };

type AuthContextValue = {
  auth: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    apiFetch("/api/auth/admin/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAuth({ status: "authenticated", adminId: data.adminId, displayName: data.displayName });
        } else {
          setAuth({ status: "unauthenticated" });
        }
      })
      .catch(() => setAuth({ status: "unauthenticated" }));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiFetch("/api/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "فشل تسجيل الدخول");
    }
    const data = await res.json();
    setAuth({ status: "authenticated", adminId: data.adminId, displayName: data.displayName });
  };

  const logout = async () => {
    await apiFetch("/api/auth/admin/logout", { method: "POST" });
    setAuth({ status: "unauthenticated" });
  };

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
