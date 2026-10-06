import type { ComponentPropsWithRef } from 'react';
import { cx } from '../cx';
import styles from './Logo.module.css';

export type LogoSize = 'sm' | 'md';

export interface LogoProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The product name: the accessible name, and the wordmark text when shown. */
  label: string;
  /** Show the name as text beside the mark. */
  showWordmark?: boolean;
  /** Hide the whole logo from assistive tech (when the name is given elsewhere). */
  decorative?: boolean;
  /** Mark size: sm (default) or md. */
  size?: LogoSize;
}

/**
 * The brand mark (docs/design/brand/alma-mark.svg) with an optional wordmark.
 * Colours come from tokens via CSS classes, never the SVG file's hex fills.
 */
export function Logo({
  label,
  showWordmark = false,
  decorative = false,
  size = 'sm',
  className,
  ...rest
}: LogoProps) {
  const named = !decorative && !showWordmark;
  return (
    <span
      {...rest}
      data-size={size}
      className={cx(styles.logo, className)}
      role={named ? 'img' : undefined}
      aria-label={named ? label : undefined}
      aria-hidden={decorative ? true : undefined}
    >
      <svg className={styles.svg} viewBox="0 0 52 52" aria-hidden="true" focusable="false">
        <rect className={styles.mark} width="52" height="52" rx="14" />
        <path
          className={styles.glyph}
          d="M14 38 L26 14 L38 38"
          fill="none"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && <span className={styles.wordmark}>{label}</span>}
    </span>
  );
}
