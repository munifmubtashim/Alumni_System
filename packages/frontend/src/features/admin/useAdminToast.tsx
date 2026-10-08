import { useCallback, useEffect, useRef, useState, type ReactElement, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { Toast } from '@/components/ui/Toast';

/** How long a toast stays (it can also be dismissed); the same as /me's. */
export const TOAST_MS = 4000;
export const TOAST_DISMISS_LABEL = 'Dismiss';

function focusIsLost(): boolean {
  const active = document.activeElement;
  return active === null || active === document.body || !active.isConnected;
}

export interface AdminToast {
  /** Shows `text`, replacing any toast already showing. */
  showToast: (text: string) => void;
  /** The Toast to render once in the page (always mounted, G36). */
  toastElement: ReactElement;
}

/**
 * The admin page's success toast, the /me pattern (G36): the Toast stays
 * mounted so its status region is in the page before a message is written
 * in; it closes after TOAST_MS, paused while hovered or holding focus (tracked
 * per toast id); when it closes under the user's focus, focus goes to
 * `fallbackRef` (the page heading) without scrolling.
 */
export function useAdminToast(fallbackRef: RefObject<HTMLElement | null>): AdminToast {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const count = useRef(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const paused = toast !== null && (hovered === toast.id || focused === toast.id);

  useEffect(() => {
    if (toast === null || paused) return;
    const timer = setTimeout(() => {
      flushSync(() => {
        setToast(null);
      });
      // preventScroll: this fires on a timer, so it must not jump the page.
      if (focusIsLost()) fallbackRef.current?.focus({ preventScroll: true });
    }, TOAST_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [toast, paused, fallbackRef]);

  const showToast = useCallback((text: string) => {
    count.current += 1;
    setToast({ id: count.current, text });
  }, []);

  const toastElement = (
    <Toast
      dismissLabel={TOAST_DISMISS_LABEL}
      onDismiss={() => {
        // Dismiss unmounts under the pointer or keyboard.
        flushSync(() => {
          setToast(null);
        });
        if (focusIsLost()) fallbackRef.current?.focus();
      }}
      onMouseEnter={() => {
        if (toast !== null) setHovered(toast.id);
      }}
      onMouseLeave={() => {
        setHovered(null);
      }}
      onFocus={() => {
        if (toast !== null) setFocused(toast.id);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
      }}
    >
      {toast?.text ?? null}
    </Toast>
  );

  return { showToast, toastElement };
}
