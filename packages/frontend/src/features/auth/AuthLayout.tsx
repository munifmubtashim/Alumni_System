import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/ui/Card';
import styles from './AuthLayout.module.css';

export interface AuthLayoutFooter {
  /** Plain lead-in, e.g. "No account?". */
  prompt: string;
  /** Link text, e.g. "Sign up". */
  linkLabel: string;
  /** Where the link goes. */
  to: string;
}

export interface AuthLayoutProps {
  /** The page heading; also the card's accessible name. */
  title: string;
  /** The line under the form that links to the other auth page. */
  footer: AuthLayoutFooter;
  children: ReactNode;
}

/**
 * Frame for the login and sign-up pages: a centered card, at most 26rem wide,
 * with a large heading, the page's content and a footer link line.
 */
export function AuthLayout({ title, footer, children }: AuthLayoutProps) {
  const titleId = useId();
  return (
    <div className={styles.layout}>
      <Card as="section" aria-labelledby={titleId} className={styles.card}>
        <div className={styles.stack}>
          <h1 id={titleId} className={styles.title}>
            {title}
          </h1>
          {children}
          <p className={styles.footer}>
            {footer.prompt}{' '}
            <Link to={footer.to} className={styles.link}>
              {footer.linkLabel}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
