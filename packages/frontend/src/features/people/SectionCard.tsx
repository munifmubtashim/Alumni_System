import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { cx } from '@/components/ui/cx';
import styles from './SectionCard.module.css';

const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4' } as const;

export type SectionHeadingLevel = keyof typeof HEADINGS;

export interface SectionCardAction {
  to: string;
  /** The visible link text ("See all"). */
  label: string;
  /** A fuller accessible name when the label alone is vague; must start with the label (WCAG 2.5.3). */
  name?: string;
}

export interface SectionCardProps {
  title: string;
  /** The title's heading level, so it fits the parent page's outline. Default 2. */
  headingLevel?: SectionHeadingLevel;
  /** A link beside the title (to the full page). */
  action?: SectionCardAction;
  /** Placement from the parent (grid area, margins). */
  className?: string;
  children: ReactNode;
}

/**
 * One section card (Home's sections, the Feed sidebar): a `<section>` named by
 * its title, with an optional link to the full page beside the title. The
 * section's own loading, empty and error content goes in as children, built
 * from the helpers below, so every section looks and behaves alike.
 */
export function SectionCard({
  title,
  headingLevel = 2,
  action,
  className,
  children,
}: SectionCardProps) {
  const headingId = useId();
  const Heading = HEADINGS[headingLevel];
  return (
    <Card as="section" aria-labelledby={headingId} className={cx(styles.section, className)}>
      <div className={styles.header}>
        <Heading id={headingId} className={styles.heading}>
          {title}
        </Heading>
        {action !== undefined && (
          <Link to={action.to} className={styles.action} aria-label={action.name}>
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

/** A loading status line for screen readers; it sits outside the aria-busy skeletons so it is announced. */
export function SectionLoadingStatus({ children }: { children: string }) {
  return (
    <VisuallyHidden as="p" role="status">
      {children}
    </VisuallyHidden>
  );
}

export interface SectionErrorProps {
  title: string;
  /** True while a retry is in flight (the button shows its spinner). */
  retrying: boolean;
  onRetry: () => void;
}

/** A section's own error: an inline alert with Retry under it, so the rest of the page stays. */
export function SectionError({ title, retrying, onRetry }: SectionErrorProps) {
  return (
    <div className={styles.error}>
      <Alert tone="error" title={title}>
        Something went wrong on our side or with the connection. Try again in a moment.
      </Alert>
      <Button className={styles.retry} loading={retrying} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/** The one-line note a section shows when it has nothing to list. */
export function SectionEmpty({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}
