import { useId, type Ref } from 'react';
import { Alert } from '@/components/ui/Alert';
import { PasswordInput } from '@/components/ui/PasswordInput';
import type { BindField } from './fields';
import styles from './Section.module.css';

export interface PasswordSectionProps {
  bind: BindField;
  /** A password-change failure that names no field (shown in this section, not at the top). */
  formError: string | null;
  formErrorRef?: Ref<HTMLDivElement>;
}

/**
 * Change password: current, new and confirmation. All three blank means "keep
 * it"; typing in any of them makes the form dirty and checks all three.
 */
export function PasswordSection({ bind, formError, formErrorRef }: PasswordSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <h2 id={headingId} className={styles.heading}>
        Password
      </h2>
      <p className={styles.intro}>Leave these blank to keep your current password.</p>
      {formError !== null && (
        <Alert ref={formErrorRef} tabIndex={-1} tone="error">
          {formError}
        </Alert>
      )}
      <PasswordInput
        label="Current password"
        autoComplete="current-password"
        {...bind('current_password')}
      />
      <div className={styles.row}>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          helperText="At least 8 characters"
          {...bind('new_password')}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          {...bind('confirm_password')}
        />
      </div>
    </section>
  );
}
