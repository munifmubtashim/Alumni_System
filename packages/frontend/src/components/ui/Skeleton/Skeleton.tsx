import type { ComponentPropsWithRef } from 'react';
import { cx } from '../cx';
import styles from './Skeleton.module.css';

export type SkeletonShape = 'line' | 'block' | 'circle';

export interface SkeletonProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** line (default, one line of text), block (a box) or circle (an avatar). */
  shape?: SkeletonShape;
}

/**
 * A grey placeholder that pulses gently while content loads. Always hidden
 * from assistive tech: the loading region says it is busy (aria-busy), not
 * each placeholder. Size it with a className; the defaults yield to any class.
 */
export function Skeleton({ shape = 'line', className, ...rest }: SkeletonProps) {
  return (
    <span
      {...rest}
      aria-hidden="true"
      data-shape={shape}
      className={cx(styles.skeleton, className)}
    />
  );
}
