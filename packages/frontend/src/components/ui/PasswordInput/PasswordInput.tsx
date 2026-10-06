import { useState } from 'react';
import { Input, type InputProps } from '../Input';
import styles from './PasswordInput.module.css';

export type PasswordInputProps = Omit<InputProps, 'type' | 'endAdornment'>;

/**
 * A password field with a show/hide button. A drop-in for
 * `<Input type="password">`: every other Input prop (ref, error, autoComplete,
 * helperText) passes straight through.
 */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          className={styles.toggle}
          // The flipping name carries the state, so there is no aria-pressed.
          aria-label={visible ? 'Hide password' : 'Show password'}
          // Keep focus in the input when the button is clicked with a mouse.
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            setVisible((v) => !v);
          }}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}

function EyeIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
