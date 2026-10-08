import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import styles from './AdminStates.module.css';

export interface EmptyStateProps {
  heading: string;
  text: string;
  action?: { label: string; onClick: () => void };
}

/** A centred heading, line of text and optional action, for an empty table. */
export function EmptyState({ heading, text, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <h3 className={styles.heading}>{heading}</h3>
      <p className={styles.text}>{text}</p>
      {action !== undefined && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export interface LoadErrorProps {
  onRetry: () => void;
  /** True while the retry is in flight: the button shows busy and is disabled. */
  retrying?: boolean;
}

/** The alumni list failed to load: an error and a Retry button. */
export function LoadError({ onRetry, retrying = false }: LoadErrorProps) {
  return (
    <div className={styles.error}>
      <Alert tone="error" title="The alumni list didn't load">
        Something went wrong on our side or with the connection. Try again in a moment.
      </Alert>
      <Button loading={retrying} onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
