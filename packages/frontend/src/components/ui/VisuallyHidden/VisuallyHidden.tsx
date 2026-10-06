import type { ComponentPropsWithoutRef, ElementType } from 'react';
import { cx } from '../cx';
import styles from './VisuallyHidden.module.css';

export type VisuallyHiddenProps<T extends ElementType = 'span'> = {
  /** The element to render. A span by default; use `label` for a hidden field label. */
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

/**
 * Text that is not drawn on screen but is still read by assistive technology:
 * a field's label when an icon says it visually, or a polite status message.
 * All other props (htmlFor, role, className) go to the element.
 */
export function VisuallyHidden<T extends ElementType = 'span'>({
  as,
  className,
  ...rest
}: VisuallyHiddenProps<T>) {
  const Tag: ElementType = as ?? 'span';
  return <Tag {...rest} className={cx(styles.visuallyHidden, className)} />;
}
