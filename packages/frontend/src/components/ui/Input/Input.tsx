import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Input.module.css';

export interface InputProps extends ComponentPropsWithRef<'input'> {
  /** Visible label, tied to the input with htmlFor. */
  label: ReactNode;
  /** Hint shown below the field; becomes the input's accessible description. */
  helperText?: ReactNode;
  /**
   * Error message for this field. When set, the input is marked aria-invalid
   * and the message is added to its accessible description (before the helper).
   */
  error?: string;
}

/** A labeled text field. Native input props (and `className`) go to the <input>. */
export function Input({
  label,
  helperText,
  error,
  id,
  className,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const hasHelper = helperText !== undefined && helperText !== null && helperText !== '';
  const hasError = error !== undefined && error !== '';
  const describedByIds = cx(describedBy, hasError && errorId, hasHelper && helperId) || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        aria-invalid={hasError ? true : ariaInvalid}
        aria-describedby={describedByIds}
        className={cx(styles.input, className)}
      />
      {hasError && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
      {hasHelper && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
    </div>
  );
}
