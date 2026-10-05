import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../cx';
import styles from './Input.module.css';

export interface InputProps extends ComponentPropsWithRef<'input'> {
  /** Visible label, tied to the input with htmlFor. */
  label: ReactNode;
  /** Hint shown below the field; becomes the input's accessible description. */
  helperText?: ReactNode;
}

/** A labeled text field. Native input props (and `className`) go to the <input>. */
export function Input({
  label,
  helperText,
  id,
  className,
  'aria-describedby': describedBy,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const hasHelper = helperText !== undefined && helperText !== null && helperText !== '';
  const describedByIds = cx(describedBy, hasHelper && helperId) || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        aria-describedby={describedByIds}
        className={cx(styles.input, className)}
      />
      {hasHelper && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
    </div>
  );
}
