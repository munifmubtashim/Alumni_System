import type { ComponentPropsWithRef } from 'react';
import { cx } from '../cx';
import styles from './Tag.module.css';

export type TagTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error';

const STATUS_TONES: ReadonlySet<TagTone> = new Set(['success', 'warning', 'error']);

export interface TagProps extends ComponentPropsWithRef<'span'> {
  /** neutral (default), accent for the one thing that stands out, or a status. */
  tone?: TagTone;
}

/**
 * A small label. Status tones show a colored dot; their text stays
 * ink-secondary, since status colors miss 4.5:1 as text (architecture.md -> Contrast).
 */
export function Tag({ tone = 'neutral', className, children, ...rest }: TagProps) {
  return (
    <span {...rest} data-tone={tone} className={cx(styles.tag, className)}>
      {STATUS_TONES.has(tone) && <span aria-hidden="true" className={styles.dot} />}
      {children}
    </span>
  );
}
