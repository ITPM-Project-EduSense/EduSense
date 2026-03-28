"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

import { createContext, useContext } from "react";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = "info", duration = 4000) => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const baseStyles =
    "flex items-start gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md border animate-toast-in";

  const typeStyles = {
    success: "bg-emerald-50/95 text-emerald-700 border-emerald-200/60",
    error: "bg-rose-50/95 text-rose-700 border-rose-200/60",
    info: "bg-blue-50/95 text-blue-700 border-blue-200/60",
    warning: "bg-amber-50/95 text-amber-700 border-amber-200/60",
  };

  const icons = {
    success: <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />,
    error: <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />,
    info: <Info size={18} className="flex-shrink-0 mt-0.5" />,
    warning: <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />,
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`${baseStyles} ${typeStyles[toast.type]} ${
        isExiting ? "animate-toast-out" : ""
      }`}
    >
      {icons[toast.type]}
      <div className="flex-1 break-words">{toast.message}</div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 ml-2 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}
