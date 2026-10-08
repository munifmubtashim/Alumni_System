import type { ReactNode, RefObject } from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import styles from './Drawer.module.css';

/** Where focus goes when the drawer opens or closes. */
export type DrawerFocusTarget = boolean | RefObject<HTMLElement | null>;

/**
 * Why the drawer asked to open or close: the × button, Escape, a click on the
 * backdrop, or anything else (e.g. focus leaving, an imperative close).
 */
export type DrawerChangeReason = 'close-press' | 'escape-key' | 'outside-press' | 'other';

export interface DrawerProps {
  /** Controlled open state. The drawer never closes itself; see onOpenChange. */
  open: boolean;
  /**
   * Called when the × button, Escape or a backdrop click asks to close. The
   * drawer stays open until the caller sets `open` to false, so a caller with
   * unsaved input can ask first (reason says what was pressed).
   */
  onOpenChange: (open: boolean, reason: DrawerChangeReason) => void;
  /** Heading (an h2) and the drawer's accessible name. */
  title: string;
  /** Body content; it scrolls when taller than the screen. */
  children: ReactNode;
  /** Optional bar pinned under the body, e.g. Cancel / Save buttons. */
  footer?: ReactNode;
  /** Accessible name of the × button. */
  closeLabel?: string;
  /**
   * Element focused on open. Default: the first focusable element inside
   * (the × button), or the panel itself when opened by touch.
   */
  initialFocus?: DrawerFocusTarget;
  /**
   * Element focused on close. Default: whatever had focus before it opened
   * (usually the button that opened it). Pass a ref when that button is gone.
   */
  finalFocus?: DrawerFocusTarget;
}

function toReason(reason: string): DrawerChangeReason {
  return reason === 'close-press' || reason === 'escape-key' || reason === 'outside-press'
    ? reason
    : 'other';
}

/**
 * A modal side panel anchored to the right edge (420px from 48rem, full width
 * below), over a scrim. Focus moves in on open, is trapped while open and
 * returns on close; page scroll is locked. Header: the h2 title and a ×
 * button; then a scrolling body and an optional footer bar. Controlled only.
 * Base UI Dialog supplies the behaviour; its types stay inside.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
  closeLabel = 'Close',
  initialFocus,
  finalFocus,
}: DrawerProps) {
  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next, details) => {
        onOpenChange(next, toReason(details.reason));
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup
          className={styles.panel}
          initialFocus={initialFocus}
          finalFocus={finalFocus}
        >
          <div className={styles.header}>
            <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title>
            <BaseDialog.Close className={styles.close} aria-label={closeLabel}>
              <svg
                className={styles.closeIcon}
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </BaseDialog.Close>
          </div>
          <div className={styles.body}>{children}</div>
          {footer !== undefined && footer !== null && <div className={styles.footer}>{footer}</div>}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
