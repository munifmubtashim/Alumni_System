import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sessionNoticeAtom } from '@/store/sessionNoticeAtom';
import { INVALID_CREDENTIALS_MESSAGE, mapLoginError, UNEXPECTED_MESSAGE } from './authErrors';
import { AuthLayout } from './AuthLayout';
import { useLogin } from './useLogin';
import { validateLogin, type LoginErrors, type LoginValues } from './validation';
import styles from './LoginPage.module.css';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired, please log in again';

type LoginField = keyof LoginValues;
const FIELD_ORDER: readonly LoginField[] = ['email', 'password'];

/**
 * /login. Validates on submit (field messages, focus on the first invalid
 * field), then logs in. It never navigates: GuestOnly redirects once the
 * token is stored (ADV-003).
 */
export function LoginPage() {
  const login = useLogin();
  const liveNotice = useAtomValue(sessionNoticeAtom);
  const setNotice = useSetAtom(sessionNoticeAtom);
  // Keep the notice that brought the user here: StrictMode's trial unmount
  // runs the cleanup below once, which clears the atom right after mount.
  const [noticeAtMount] = useState(liveNotice);
  const notice = liveNotice ?? noticeAtMount;

  // Consume the notice so it doesn't show again on a later visit (ADV-008).
  useEffect(
    () => () => {
      setNotice(null);
    },
    [setNotice],
  );

  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function focusField(field: LoginField) {
    (field === 'email' ? emailRef : passwordRef).current?.focus();
  }

  function handleChange(field: LoginField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (login.isPending) return;

    const nextErrors = validateLogin(values);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field] !== undefined);
    // Render the messages before moving focus, so the field is announced
    // together with its error.
    flushSync(() => {
      setErrors(nextErrors);
      setFormError(null);
    });
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    login.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onError: (error) => {
          const message = mapLoginError(error).form ?? UNEXPECTED_MESSAGE;
          setFormError(message);
          // Wrong credentials: keep the email, clear the password.
          if (message === INVALID_CREDENTIALS_MESSAGE) {
            setValues((prev) => ({ ...prev, password: '' }));
          }
        },
      },
    );
  }

  return (
    <AuthLayout title="Log in" footer={{ prompt: 'No account?', linkLabel: 'Sign up', to: '/register' }}>
      {notice === 'expired' && <Alert tone="info">{SESSION_EXPIRED_MESSAGE}</Alert>}
      <form noValidate className={styles.form} onSubmit={handleSubmit}>
        {formError !== null && <Alert tone="error">{formError}</Alert>}
        <Input
          ref={emailRef}
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          onChange={handleChange('email')}
        />
        <Input
          ref={passwordRef}
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={handleChange('password')}
        />
        <Button type="submit" variant="primary" loading={login.isPending} className={styles.submit}>
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
}
