import React, { createContext, useContext, useEffect, useState } from "react";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; merchantId: number }
  | { status: "unauthenticated" };

type AuthContextValue = {
  auth: AuthState;
  login: (email: string, password: string) => Promise<{ merchantId: number }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, init?: RequestInit) {
  return fetch(`${BASE}${path}`, {
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
    apiFetch("/api/auth/merchant/me")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAuth({ status: "authenticated", merchantId: data.merchantId });
        } else {
          setAuth({ status: "unauthenticated" });
        }
      })
      .catch(() => {
        setAuth({ status: "unauthenticated" });
      });
  }, []);

  const login = async (email: string, password: string): Promise<{ merchantId: number }> => {
    const res = await apiFetch("/api/auth/merchant/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Login failed");
    }

    const data = await res.json();
    setAuth({ status: "authenticated", merchantId: data.merchantId });
    return { merchantId: data.merchantId };
  };

  const logout = async () => {
    await apiFetch("/api/auth/merchant/logout", { method: "POST" });
    setAuth({ status: "unauthenticated" });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
