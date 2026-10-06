import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';
import { cx } from '../cx';
import styles from './Chip.module.css';

export interface ChipProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The visible text, e.g. "Department: Computer Science". */
  children: ReactNode;
  /** Called when the remove (x) button is pressed. */
  onRemove: () => void;
  /** Accessible name of the remove button, e.g. "Remove Department: Computer Science". */
  removeLabel: string;
  /** Ref to the remove button, so a caller can move focus to it. */
  removeButtonRef?: Ref<HTMLButtonElement>;
}

/** A pill showing an active filter, with a button that removes it. */
export function Chip({
  children,
  onRemove,
  removeLabel,
  removeButtonRef,
  className,
  ...rest
}: ChipProps) {
  return (
    <span {...rest} className={cx(styles.chip, className)}>
      <span className={styles.label}>{children}</span>
      <button
        ref={removeButtonRef}
        type="button"
        className={styles.remove}
        aria-label={removeLabel}
        onClick={onRemove}
      >
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </span>
  );
}
