import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Toast.module.css';

export interface ToastProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'role'> {
  /** The message, e.g. "Profile updated successfully". */
  children: ReactNode;
  /** Called when the dismiss (x) button is pressed. */
  onDismiss: () => void;
  /** Accessible name of the dismiss button, e.g. "Dismiss". */
  dismissLabel: string;
}

/**
 * A short success message pinned to the top of the screen (top-right from
 * 48rem, full width on a phone), with a decorative check and a dismiss button.
 * Purely presentational: the caller decides when it shows and owns any
 * auto-dismiss timer. Only the message sits in the role="status" region, so
 * the dismiss button's name is not read out with it.
 */
export function Toast({ children, onDismiss, dismissLabel, className, ...rest }: ToastProps) {
  return (
    <div {...rest} className={cx(styles.toast, className)}>
      <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <p role="status" className={styles.message}>
        {children}
      </p>
      <button
        type="button"
        className={styles.dismiss}
        aria-label={dismissLabel}
        onClick={onDismiss}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
