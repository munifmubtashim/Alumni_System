import { Link, type LinkProps } from 'react-router';
import { cx } from '../cx';
import type { ButtonVariant } from './Button';
import styles from './Button.module.css';

export interface ButtonLinkProps extends LinkProps {
  /** Emphasis level, same as Button. Use at most one primary per view. */
  variant?: ButtonVariant;
}

/**
 * A navigation link that looks like a Button. Renders a react-router <Link>
 * (an <a>), so it must be used inside a router.
 */
export function ButtonLink({ variant = 'secondary', className, ...rest }: ButtonLinkProps) {
  return <Link {...rest} data-variant={variant} className={cx(styles.button, className)} />;
}
