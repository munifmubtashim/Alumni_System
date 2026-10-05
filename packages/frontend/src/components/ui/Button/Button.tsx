import type { ComponentPropsWithRef } from 'react';
import { cx } from '../cx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  /** Emphasis level. Use at most one primary button per view. */
  variant?: ButtonVariant;
}

export function Button({
  variant = 'secondary',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      // Defaults to "button" so it never submits a form by accident.
      type={type}
      data-variant={variant}
      className={cx(styles.button, className)}
    />
  );
}
