import { useState, useCallback } from "react";

export enum IToastCategory {
  DEFAULT = "DEFAULT",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
  WARNING = "WARNING",
}

interface ToastMessage {
  message: string;
  category?: IToastCategory;
  duration?: number;
}

export const useToastMessage = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      message: string,
      icon?: React.ReactNode,
      category: IToastCategory = IToastCategory.DEFAULT,
      duration: number = 3000
    ) => {
      const newToast: ToastMessage = {
        message,
        category,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast !== newToast));
      }, duration);

      // For now, just log to console
      console.log(`[${category}] ${message}`, icon);
    },
    []
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    showToast,
    clearToasts,
    toasts,
  };
};

export default useToastMessage;
