import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
// Toast styles live in styles/components.css (shared UI primitives, loaded
// once in main.tsx) alongside .panel/.badge/.state-panel.

type ToastTone = 'success' | 'error';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const DISMISS_AFTER_MS = 5000;

// Mounted once, above the router (App.tsx) - so a toast shown right before a
// navigate() call (e.g. placing an order, then jumping to the order page)
// stays on screen instead of unmounting with the page that triggered it.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const dismiss = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setToast({ id: Date.now(), message, tone });
    timeoutRef.current = window.setTimeout(dismiss, DISMISS_AFTER_MS);
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast--${toast.tone}`} role="status" aria-live="polite">
          <span className="toast__icon" aria-hidden="true">
            {toast.tone === 'success' ? '\u{2705}' : '\u{26A0}\u{FE0F}'}
          </span>
          <p className="toast__message">{toast.message}</p>
          <button type="button" className="toast__close" aria-label="Dismiss" onClick={dismiss}>
            {'\u{2715}'}
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
