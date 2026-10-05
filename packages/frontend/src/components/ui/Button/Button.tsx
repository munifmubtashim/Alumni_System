import type { ComponentPropsWithRef } from 'react';
import { cx } from '../cx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  /** Emphasis level. Use at most one primary button per view. */
  variant?: ButtonVariant;
  /**
   * Busy state, e.g. while a form submits. Disables the button, sets
   * aria-busy and shows a small pulsing dot; the label stays as it is.
   */
  loading?: boolean;
}

export function Button({
  variant = 'secondary',
  type = 'button',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      // Defaults to "button" so it never submits a form by accident.
      type={type}
      disabled={disabled === true || loading}
      aria-busy={loading ? true : undefined}
      data-variant={variant}
      className={cx(styles.button, className)}
    >
      {children}
      {loading && <span aria-hidden="true" className={styles.busyDot} />}
    </button>
  );
}
