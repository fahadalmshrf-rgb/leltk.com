import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "lailtak.merchantId";

type MerchantContextValue = {
  merchantId: number | null;
  ready: boolean;
  signIn: (id: number) => Promise<void>;
  signOut: () => Promise<void>;
};

const MerchantContext = createContext<MerchantContextValue | undefined>(undefined);

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const [merchantId, setMerchantId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        if (value) {
          const parsed = Number(value);
          if (Number.isFinite(parsed) && parsed > 0) setMerchantId(parsed);
        }
        setReady(true);
      })
      .catch(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = async (id: number) => {
    await AsyncStorage.setItem(STORAGE_KEY, String(id));
    setMerchantId(id);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setMerchantId(null);
  };

  return (
    <MerchantContext.Provider value={{ merchantId, ready, signIn, signOut }}>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  const ctx = useContext(MerchantContext);
  if (!ctx) throw new Error("useMerchant must be used within MerchantProvider");
  return ctx;
}
