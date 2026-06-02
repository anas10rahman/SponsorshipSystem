/* Toast system — context + dispatcher.
   Pakai useToast() di komponen mana saja. */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "failed" | "info";

type Toast = {
  id: string;
  variant: ToastVariant;
  message: string;
};

type ToastContextValue = {
  toast: (variant: ToastVariant, message: string) => void;
  success: (message: string) => void;
  failed: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  failed: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

const DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev, { id, variant, message }]);
      window.setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (msg) => toast("success", msg),
      failed: (msg) => toast("failed", msg),
      info: (msg) => toast("info", msg),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="sh-toast-region" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`sh-toast sh-toast--${t.variant}`}>
            {ICONS[t.variant]}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Tutup notifikasi"
              style={{ color: "inherit", opacity: 0.8 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
