/**
 * Toast Component - 100% User-Friendly
 * Notification system with auto-dismiss and accessibility
 */

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300); // Wait for fade out animation
  };

  const typeStyles: Record<
    ToastType,
    { bg: string; text: string; icon: string }
  > = {
    success: {
      bg: "bg-green-50 border-green-500",
      text: "text-green-800",
      icon: "✓",
    },
    error: {
      bg: "bg-red-50 border-red-500",
      text: "text-red-800",
      icon: "✕",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-500",
      text: "text-yellow-800",
      icon: "⚠",
    },
    info: {
      bg: "bg-blue-50 border-blue-500",
      text: "text-blue-800",
      icon: "ℹ",
    },
  };

  const styles = typeStyles[type];

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-lg
        transition-all duration-300
        ${styles.bg} ${styles.text}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
      `}
      role="alert"
      aria-live="polite"
    >
      <span className="text-xl font-bold" aria-hidden="true">
        {styles.icon}
      </span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="text-current hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-current rounded"
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<{ toasts: ToastProps[] }> = ({
  toasts,
}) => {
  const container = (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );

  return createPortal(container, document.body);
};

// Toast Hook for easy usage
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastProps = {
      id,
      type,
      message,
      duration,
      onClose: (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
    };
    setToasts((prev) => [...prev, toast]);
  };

  return {
    toasts,
    success: (message: string, duration?: number) =>
      showToast("success", message, duration),
    error: (message: string, duration?: number) =>
      showToast("error", message, duration),
    warning: (message: string, duration?: number) =>
      showToast("warning", message, duration),
    info: (message: string, duration?: number) =>
      showToast("info", message, duration),
  };
}

export default Toast;
