import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Textarea.module.css';

export interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  /** Visible label, tied to the textarea with htmlFor. */
  label: ReactNode;
  /** Hint shown below the field; becomes the textarea's accessible description. */
  helperText?: ReactNode;
  /**
   * Error message for this field. When set, the textarea is marked aria-invalid
   * and the message is added to its accessible description (before the helper).
   */
  error?: string;
}

/**
 * A labeled multi-line text field, with Input's label, helper and error
 * contract. Native textarea props (and `className`) go to the <textarea>;
 * `rows` defaults to 4 and the user can resize it vertically.
 */
export function Textarea({
  label,
  helperText,
  error,
  id,
  className,
  rows = 4,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;
  const hasHelper = helperText !== undefined && helperText !== null && helperText !== '';
  const hasError = error !== undefined && error !== '';
  const describedByIds = cx(describedBy, hasError && errorId, hasHelper && helperId) || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={textareaId}>
        {label}
      </label>
      <textarea
        {...rest}
        id={textareaId}
        rows={rows}
        aria-invalid={hasError ? true : ariaInvalid}
        aria-describedby={describedByIds}
        className={cx(styles.textarea, className)}
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
