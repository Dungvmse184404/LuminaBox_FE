import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { cn } from "@/lib/cn";

type Kind = "success" | "error";
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((kind: Kind, message: string) => {
    const id = nextId++;
    setItems((list) => [...list, { id, kind, message }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  const api = useMemo<ToastApi>(() => ({ success: (m) => push("success", m), error: (m) => push("error", m) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "lb-page-enter pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg",
              t.kind === "success" ? "bg-success" : "bg-danger",
            )}
          >
            {t.kind === "success" ? <CircleCheck size={16} /> : <CircleX size={16} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
