import type { ComponentPropsWithRef } from 'react';
import { cx } from '../cx';
import styles from './Card.module.css';

export type CardElement = 'div' | 'article' | 'section';

export interface CardProps extends ComponentPropsWithRef<'div'> {
  /** Element to render; use article/section when the card is a standalone item. */
  as?: CardElement;
}

/** The default container: raised surface, hairline border, large radius. */
export function Card({ as: Element = 'div', className, ...rest }: CardProps) {
  return <Element {...rest} className={cx(styles.card, className)} />;
}
