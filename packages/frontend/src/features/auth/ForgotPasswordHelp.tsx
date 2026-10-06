import { useId, useState } from 'react';
import { PASSWORD_RESET_SUBJECT, SUPPORT_EMAIL, supportMailto } from '@/config/brand';
import styles from './ForgotPasswordHelp.module.css';

/**
 * "Forgot password?" on the login page (spec AC5): a disclosure button that
 * shows how to reach support. No navigation and no request. Placed right after
 * the password field: the button sits at the end edge and the message opens
 * below it.
 */
export function ForgotPasswordHelp() {
  const [open, setOpen] = useState(false);
  const messageId = useId();

  return (
    <div className={styles.help}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={messageId}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        Forgot password?
      </button>
      <p id={messageId} className={styles.message} hidden={!open}>
        Contact support at <a href={supportMailto(PASSWORD_RESET_SUBJECT)}>{SUPPORT_EMAIL}</a> from
        your registered email address, and we&apos;ll help you reset your password.
      </p>
    </div>
  );
}
