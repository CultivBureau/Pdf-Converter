"use client";

import { AuthProvider } from "./contexts/AuthContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ToastProvider } from "./components/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HistoryProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </HistoryProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

