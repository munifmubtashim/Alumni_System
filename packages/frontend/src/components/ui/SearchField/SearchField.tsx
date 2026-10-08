import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../cx';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './SearchField.module.css';

export interface SearchFieldProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  /**
   * The field's accessible name. It is visually hidden (the search icon and
   * the placeholder carry the meaning on screen) but still read out.
   */
  label: ReactNode;
  /** Accessible name of the clear button shown while the box has text. Default "Clear search text" (not "Clear search", which the admin no-match state already uses for its own button). */
  clearLabel?: string;
}

/**
 * A search box: a leading search icon, an `<input type="search">` with a
 * visually hidden label and, while it has text, a clear button. The browser's
 * own clear control is hidden. Clearing goes through `onChange` (with
 * `event.target.value === ''`), so a controlled caller needs nothing extra,
 * and focus returns to the input. Native input props (and `className`) go to
 * the <input>.
 */
export function SearchField({
  label,
  clearLabel = 'Clear search text',
  id,
  className,
  ref,
  onChange,
  ...rest
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      return assignRef(ref, node);
    },
    [ref],
  );

  // Uncontrolled use has no value prop, so track whether there is text here.
  const [uncontrolledHasText, setUncontrolledHasText] = useState(
    () => String(rest.defaultValue ?? '') !== '',
  );
  const controlled = rest.value !== undefined;
  const hasText = controlled ? String(rest.value) !== '' : uncontrolledHasText;
  const showClear = hasText && !rest.disabled && !rest.readOnly;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!controlled) setUncontrolledHasText(event.target.value !== '');
    onChange?.(event);
  }

  function clear() {
    const input = inputRef.current;
    if (!input) return;
    // Set the value with the native setter and fire a real input event, so
    // React reports it through onChange like any other edit.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }

  return (
    <div className={styles.field}>
      <VisuallyHidden as="label" htmlFor={inputId}>
        {label}
      </VisuallyHidden>
      <SearchIcon />
      <input
        {...rest}
        ref={setRefs}
        id={inputId}
        type="search"
        className={cx(styles.input, className)}
        onChange={handleChange}
      />
      {showClear && (
        <button type="button" className={styles.clear} aria-label={clearLabel} onClick={clear}>
          <svg className={styles.clearIcon} viewBox="0 0 24 24" aria-hidden focusable={false}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Hands the node to a caller's ref (object or callback), returning a callback ref's cleanup. */
function assignRef<T>(ref: Ref<T> | undefined, node: T | null): (() => void) | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(node);
    return typeof cleanup === 'function' ? cleanup : undefined;
  }
  if (ref) ref.current = node;
  return undefined;
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
