import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Alert.module.css';

export type AlertTone = 'error' | 'info';

export interface AlertProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'role'> {
  /** error announces at once (role="alert"); info is polite (role="status"). */
  tone: AlertTone;
  /** Optional bold first line. */
  title?: ReactNode;
  children?: ReactNode;
}

/**
 * A form- or page-level message box. Tone shows as a colored border and dot;
 * the text stays ink-primary, so the message never depends on color alone.
 */
export function Alert({ tone, title, className, children, ...rest }: AlertProps) {
  return (
    <div
      {...rest}
      role={tone === 'error' ? 'alert' : 'status'}
      data-tone={tone}
      className={cx(styles.alert, className)}
    >
      <span aria-hidden="true" className={styles.dot} />
      <div className={styles.body}>
        {title !== undefined && title !== null && title !== '' && (
          <p className={styles.title}>{title}</p>
        )}
        {children}
      </div>
    </div>
  );
}
