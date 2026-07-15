import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  leaving: boolean;
}

const ToastContext = createContext<((kind: ToastKind, message: string) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast() must be used within a ToastProvider");
  return ctx;
}

const KIND_STYLE: Record<ToastKind, { bg: string; icon: typeof CheckCircle2 }> = {
  success: { bg: "linear-gradient(135deg,#0E9F5B,#12B76A)", icon: CheckCircle2 },
  error: { bg: "linear-gradient(135deg,#C93A3F,#E5484D)", icon: AlertCircle },
  info: { bg: "linear-gradient(135deg,#0B2432,#1D3A4A)", icon: Info },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, kind, message, leaving: false }]);
    setTimeout(() => {
      setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    }, 3200);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="fixed left-0 right-0 z-[80] flex flex-col items-center gap-2 px-5 pointer-events-none"
        style={{ bottom: "calc(96px + env(safe-area-inset-bottom))" }}
      >
        {toasts.map((toast) => {
          const style = KIND_STYLE[toast.kind];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              className="flex items-center gap-2.5 max-w-md w-fit text-white text-[13.5px] font-bold px-4 py-3 rounded-2xl shadow-[0_16px_32px_-12px_rgba(11,36,50,0.55)]"
              style={{
                background: style.bg,
                animation: toast.leaving ? "waToastOut .4s ease both" : "waToastIn .35s cubic-bezier(.2,.9,.3,1.2) both",
              }}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span style={{ textAlign: "start" }}>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
