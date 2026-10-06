import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { BRAND_NAME } from '@/config/brand';
import styles from './AuthLayout.module.css';

export interface AuthLayoutFooter {
  /** Plain lead-in, e.g. "New here?". */
  prompt: string;
  /** Link text, e.g. "Create an account". */
  linkLabel: string;
  /** Where the link goes. */
  to: string;
}

export interface AuthLayoutProps {
  /** The page heading; also the form section's accessible name. */
  title: string;
  /** The line right under the heading that links to the other auth page. */
  footer: AuthLayoutFooter;
  /** The brand panel's large line (wide screens only). */
  headline?: string;
  children: ReactNode;
}

const DEFAULT_HEADLINE = 'Stay close to the people you studied with.';

const COPYRIGHT = `© 2026 ${BRAND_NAME}`;

// Neutral on purpose: no member or university counts (spec AC3).
const POINTS: readonly string[] = [
  'Find classmates and mentors in your field',
  'Share news with your alumni network',
  'Your profile is visible only to signed-in members',
];

/**
 * Frame for the login and sign-up pages (docs/design/screens/login, signup).
 * From 60rem: a full-height brand panel (logo, headline and points, ©) beside
 * the form. Below that the panel is only its logo row, above the form. The
 * logo is named (its wordmark) because these pages have no app header. The
 * panel is a plain div, not <aside>, so <main> holds no nested landmark, and
 * the headline is a <p>, so the form's h1 is the page's only h1.
 */
export function AuthLayout({
  title,
  footer,
  headline = DEFAULT_HEADLINE,
  children,
}: AuthLayoutProps) {
  const titleId = useId();
  return (
    <div className={styles.layout}>
      <div className={styles.panel}>
        <Logo showWordmark size="md" label={BRAND_NAME} className={styles.logo} />
        <div className={styles.pitch}>
          <p className={styles.headline}>{headline}</p>
          <ul className={styles.points}>
            {POINTS.map((point) => (
              <li key={point} className={styles.point}>
                <CheckIcon />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.copyright}>{COPYRIGHT}</p>
      </div>
      <div className={styles.column}>
        <section aria-labelledby={titleId} className={styles.form}>
          <div className={styles.intro}>
            <h1 id={titleId} className={styles.title}>
              {title}
            </h1>
            <p className={styles.prompt}>
              {footer.prompt}{' '}
              <Link to={footer.to} className={styles.link}>
                {footer.linkLabel}
              </Link>
            </p>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
