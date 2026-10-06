import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../cx';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  /**
   * The field's accessible name. It is visually hidden (the search icon and
   * the placeholder carry the meaning on screen) but still read out.
   */
  label: ReactNode;
}

/**
 * A search box: a leading search icon and an `<input type="search">` with a
 * visually hidden label. Native input props (and `className`) go to the <input>.
 */
export function SearchField({ label, id, className, ...rest }: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <VisuallyHidden as="label" htmlFor={inputId}>
        {label}
      </VisuallyHidden>
      <SearchIcon />
      <input {...rest} id={inputId} type="search" className={cx(styles.input, className)} />
    </div>
  );
}

// Feather-style magnifier, same line weight as the other inline icons.
function SearchIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
