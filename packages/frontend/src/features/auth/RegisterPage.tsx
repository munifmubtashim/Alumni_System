import type { SignupRole } from '@alumni/shared';
import { useRef, useState, type ChangeEvent, type RefObject, type SubmitEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/SegmentedControl';
import { mapRegisterError, UNEXPECTED_MESSAGE } from './authErrors';
import { AuthLayout } from './AuthLayout';
import { useRegister } from './useRegister';
import {
  EXPECTED_YEAR_SPAN,
  toRegisterInput,
  validateRegister,
  type RegisterErrors,
  type RegisterValues,
} from './validation';
import styles from './RegisterPage.module.css';

export const ROLE_LABEL = 'I am a…';

const ROLE_OPTIONS: readonly SegmentedControlOption<SignupRole>[] = [
  { value: 'student', label: 'Student' },
  { value: 'alumni', label: 'Alumni' },
];

type RegisterField = keyof RegisterErrors;

// Form order: the first invalid field in this list gets focus.
const FIELD_ORDER: readonly RegisterField[] = [
  'name',
  'email',
  'password',
  'university',
  'department',
  'expected_graduation_year',
];

const INITIAL_VALUES: RegisterValues = {
  role: 'student',
  name: '',
  email: '',
  password: '',
  university: '',
  department: '',
  expected_graduation_year: '',
};

/**
 * /register. Role first (Student by default), then only the fields the
 * backend needs for that role. Fields hidden by a role switch keep their
 * values but are neither validated nor sent. Like LoginPage it never
 * navigates: GuestOnly redirects once the token is stored (ADV-003).
 */
export function RegisterPage() {
  const registerUser = useRegister();
  const [values, setValues] = useState<RegisterValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // Set by a 409, so the email error can offer a link to log in.
  const [emailTaken, setEmailTaken] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const universityRef = useRef<HTMLInputElement>(null);
  const departmentRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);

  const isStudent = values.role === 'student';
  const thisYear = new Date().getFullYear();

  function focusField(field: RegisterField) {
    const refs: Record<RegisterField, RefObject<HTMLInputElement | null>> = {
      name: nameRef,
      email: emailRef,
      password: passwordRef,
      university: universityRef,
      department: departmentRef,
      expected_graduation_year: yearRef,
    };
    refs[field].current?.focus();
  }

  function handleChange(field: RegisterField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      if (field === 'email') setEmailTaken(false);
    };
  }

  function handleRoleChange(role: SignupRole) {
    setValues((prev) => ({ ...prev, role }));
    // Student-only messages would be stale when the fields come back.
    setErrors((prev) => ({ ...prev, department: undefined, expected_graduation_year: undefined }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registerUser.isPending) return;

    const nextErrors = validateRegister(values);
    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field] !== undefined);
    // Render the messages before moving focus, so the field is announced
    // together with its error.
    flushSync(() => {
      setErrors(nextErrors);
      setFormError(null);
      setEmailTaken(false);
    });
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    registerUser.mutate(toRegisterInput(values), {
      onError: (error) => {
        const mapped = mapRegisterError(error);
        const emailError = mapped.fields?.email;
        if (emailError !== undefined) {
          flushSync(() => {
            setErrors((prev) => ({ ...prev, email: emailError }));
            setEmailTaken(true);
          });
          focusField('email');
          return;
        }
        flushSync(() => {
          setFormError(mapped.form ?? UNEXPECTED_MESSAGE);
        });
        // The busy button was disabled, which dropped focus to the page (UI-001).
        formErrorRef.current?.focus();
      },
    });
  }

  return (
    <AuthLayout
      title="Sign up"
      headline="Stay connected with your alumni network."
      footer={{ prompt: 'Already have an account?', linkLabel: 'Log in', to: '/login' }}
    >
      <form noValidate className={styles.form} onSubmit={handleSubmit}>
        {formError !== null && (
          <Alert ref={formErrorRef} tabIndex={-1} tone="error">
            {formError}
          </Alert>
        )}
        <div className={styles.role}>
          {/* The radiogroup carries the same text as its accessible name. */}
          <span aria-hidden="true" className={styles.roleLabel}>
            {ROLE_LABEL}
          </span>
          <SegmentedControl<SignupRole>
            label={ROLE_LABEL}
            options={ROLE_OPTIONS}
            value={values.role}
            onValueChange={handleRoleChange}
          />
        </div>
        <Input
          ref={nameRef}
          label="Name"
          name="name"
          autoComplete="name"
          value={values.name}
          error={errors.name}
          onChange={handleChange('name')}
        />
        <Input
          ref={emailRef}
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          value={values.email}
          error={errors.email}
          helperText={
            emailTaken ? (
              <Link to="/login" className={styles.link}>
                Log in instead
              </Link>
            ) : undefined
          }
          onChange={handleChange('email')}
        />
        <PasswordInput
          ref={passwordRef}
          label="Password"
          name="password"
          autoComplete="new-password"
          helperText="At least 8 characters"
          value={values.password}
          error={errors.password}
          onChange={handleChange('password')}
        />
        <Input
          ref={universityRef}
          label="University"
          name="university"
          autoComplete="organization"
          value={values.university}
          error={errors.university}
          onChange={handleChange('university')}
        />
        {isStudent && (
          <div className={styles.pair}>
            <Input
              ref={departmentRef}
              label="Department"
              name="department"
              value={values.department}
              error={errors.department}
              onChange={handleChange('department')}
            />
            <Input
              ref={yearRef}
              label="Expected graduation year"
              name="expected_graduation_year"
              type="number"
              inputMode="numeric"
              min={thisYear}
              max={thisYear + EXPECTED_YEAR_SPAN}
              value={values.expected_graduation_year}
              error={errors.expected_graduation_year}
              onChange={handleChange('expected_graduation_year')}
            />
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={registerUser.isPending}
          className={styles.submit}
        >
          Sign up
        </Button>
      </form>
    </AuthLayout>
  );
}
