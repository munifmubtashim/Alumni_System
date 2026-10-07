import type { MyProfile } from '@alumni/shared';
import { useEffect, useRef, useState, type RefObject, type SubmitEvent } from 'react';
import { flushSync } from 'react-dom';
import { Alert } from '@/components/ui/Alert';
import { cx } from '@/components/ui/cx';
import { Toast } from '@/components/ui/Toast';
import { CareerSection } from './CareerSection';
import { EducationSection } from './EducationSection';
import type { BindField } from './fields';
import type { LeavePromptProps } from './LeavePrompt';
import { PasswordSection } from './PasswordSection';
import { PersonalSection } from './PersonalSection';
import { mapProfileError } from './profileErrors';
import { SaveBar } from './SaveBar';
import { useLeaveGuard } from './useLeaveGuard';
import { useUpdateProfile, type SaveResult } from './useUpdateProfile';
import {
  EMPTY_PASSWORD_VALUES,
  PASSWORD_FIELDS,
  isDirty,
  planSave,
  profileFields,
  profileKind,
  toPasswordInput,
  toUpdateInput,
  toValues,
  type MeErrors,
  type MeField,
  type PasswordField,
  type PasswordValues,
  type ProfileValues,
} from './validation';
import styles from './ProfileForm.module.css';

/** How long the success toast stays (it can also be dismissed). */
export const TOAST_MS = 4000;
export const PROFILE_SAVED_TEXT = 'Profile updated successfully';
export const PASSWORD_SAVED_TEXT = 'Password changed successfully';
export const TOAST_DISMISS_LABEL = 'Dismiss';
/** S5-UnsavedToast's caption under the cards, after a save, while nothing is unsaved. */
export const ALL_SAVED_TEXT = 'All sections saved — no unsaved changes.';

function isPasswordField(field: MeField): field is PasswordField {
  return field === 'current_password' || field === 'new_password' || field === 'confirm_password';
}

function focusIsLost(): boolean {
  const active = document.activeElement;
  return active === null || active === document.body || !active.isConnected;
}

export interface ProfileFormProps {
  /** The profile from ['me'] when the form mounted. Later refetches are ignored (ADV-004). */
  profile: MyProfile;
  /** The page's h1: focus goes there when the save bar's button unmounts under it. */
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/**
 * The /me editor. MePage keys it on `user_id` only, so it initialises once;
 * from then on the saved profile (the baseline for "unsaved changes", the
 * photo_url sent back on save) lives in this component's state and is replaced
 * from the mutation's result, never from a refetch (ADV-004). The mutation,
 * the toast and the password error live here too, so a refetch of ['me'] after
 * a save never remounts the form and loses them.
 *
 * Sections follow S5's order: Personal, Education, Career, Password; the
 * account's kind decides which render (Mentorship is left out by decision).
 * Errors show after a field is left or Save is tried; a failed Save focuses
 * the first invalid field after flushSync, so it is read with its message.
 */
export function ProfileForm({ profile, headingRef }: ProfileFormProps) {
  const [saved, setSaved] = useState(profile);
  const [baseline, setBaseline] = useState<ProfileValues>(() => toValues(profile));
  const [values, setValues] = useState<ProfileValues>(baseline);
  const [password, setPassword] = useState<PasswordValues>(EMPTY_PASSWORD_VALUES);
  const [errors, setErrors] = useState<MeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastCount = useRef(0);
  // The id of the toast under the pointer / holding focus. Kept per id, so a
  // toast that unmounts while hovered (no mouseleave) never pauses the next.
  const [hoveredToast, setHoveredToast] = useState<number | null>(null);
  const [focusedToast, setFocusedToast] = useState<number | null>(null);
  const toastPaused = toast !== null && (hoveredToast === toast.id || focusedToast === toast.id);
  // A save succeeded in this visit: the "all saved" caption may show while clean.
  const [savedOnce, setSavedOnce] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const passwordErrorRef = useRef<HTMLDivElement>(null);

  const save = useUpdateProfile();
  const kind = profileKind(saved);
  const visibleFields: readonly MeField[] = [...profileFields(kind), ...PASSWORD_FIELDS];
  const dirty = isDirty(values, baseline, kind, password);
  // A save in flight blocks leaving too, so its outcome is never lost unseen (ADV-008).
  const guarding = dirty || save.isPending;
  const blocker = useLeaveGuard(guarding);

  // A blocked navigation whose reason is gone (the save it waited for settled
  // with nothing left unsaved, or the edits were typed back): drop the prompt
  // and stay, so the toast is seen; the user can follow the link again.
  useEffect(() => {
    if (blocker.state === 'blocked' && !guarding) blocker.reset();
  }, [blocker, guarding]);

  // Auto-close after TOAST_MS, paused while the toast is hovered or holds
  // focus (WCAG 2.2.1); leaving it starts a fresh TOAST_MS.
  useEffect(() => {
    if (toast === null || toastPaused) return;
    const timer = setTimeout(() => {
      // Same as closeToast (inlined to keep the effect's dependencies honest).
      flushSync(() => {
        setToast(null);
      });
      // preventScroll: this fires on a timer, so it must not jump the page to the top.
      if (focusIsLost()) headingRef.current?.focus({ preventScroll: true });
    }, TOAST_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [toast, toastPaused, headingRef]);

  function focusField(field: MeField) {
    const element = formRef.current?.elements.namedItem(field);
    if (element instanceof HTMLElement) element.focus();
  }

  function focusHeadingIfLost() {
    if (focusIsLost()) headingRef.current?.focus();
  }

  // Dismiss unmounts under the pointer or keyboard: focus goes to the heading.
  // The timer pauses while the toast has focus, but the same rule covers it.
  function closeToast() {
    flushSync(() => {
      setToast(null);
    });
    focusHeadingIfLost();
  }

  function showToast(text: string) {
    toastCount.current += 1;
    setToast({ id: toastCount.current, text });
  }

  const bind: BindField = (field) => ({
    name: field,
    value: isPasswordField(field) ? password[field] : values[field],
    error: errors[field],
    onChange: (event) => {
      const { value } = event.target;
      if (isPasswordField(field)) {
        setPassword((prev) => ({ ...prev, [field]: value }));
        setPasswordFormError(null);
      } else {
        setValues((prev) => ({ ...prev, [field]: value }));
      }
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    onBlur: () => {
      // Same rules as Save. Only adds a message: leaving a field must not wipe
      // a server error (e.g. "Current password is incorrect") shown on it.
      const message = planSave(values, baseline, kind, password).errors[field];
      if (message !== undefined) setErrors((prev) => ({ ...prev, [field]: message }));
    },
  });

  function handleDiscard() {
    flushSync(() => {
      setValues(baseline);
      setPassword(EMPTY_PASSWORD_VALUES);
      setErrors({});
      setFormError(null);
      setPasswordFormError(null);
    });
    // Discard unmounted with the bar.
    focusHeadingIfLost();
  }

  function applyResult(
    result: SaveResult,
    submittedValues: ProfileValues,
    submittedPassword: PasswordValues,
  ) {
    const passwordMapped =
      result.passwordError === null ? null : mapProfileError(result.passwordError, PASSWORD_FIELDS);
    const toastText = result.profile
      ? PROFILE_SAVED_TEXT
      : result.passwordChanged
        ? PASSWORD_SAVED_TEXT
        : null;

    flushSync(() => {
      if (result.profile) {
        const next = toValues(result.profile);
        setSaved(result.profile);
        setBaseline(next);
        // Keep anything typed while the save was in flight.
        setValues((current) => (current === submittedValues ? next : current));
      }
      if (result.passwordChanged) {
        setPassword((current) => (current === submittedPassword ? EMPTY_PASSWORD_VALUES : current));
      }
      if (passwordMapped?.fields) {
        const fields = passwordMapped.fields;
        setErrors((prev) => ({ ...prev, ...fields }));
      }
      if (passwordMapped?.form !== undefined) setPasswordFormError(passwordMapped.form);
      if (toastText !== null) {
        showToast(toastText);
        setSavedOnce(true);
      }
    });

    // The typed password stays, with its error, so it can be fixed and saved again.
    const passwordField = PASSWORD_FIELDS.find((f) => passwordMapped?.fields?.[f] !== undefined);
    if (passwordField !== undefined) focusField(passwordField);
    else if (passwordMapped?.form !== undefined) passwordErrorRef.current?.focus();
    else focusHeadingIfLost();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (save.isPending) return;

    const plan = planSave(values, baseline, kind, password);
    if (!plan.saveProfile && !plan.savePassword) return;
    const firstInvalid = visibleFields.find((field) => plan.errors[field] !== undefined);
    // Render the messages before moving focus, so the field is read with its error.
    flushSync(() => {
      setErrors(plan.errors);
      setFormError(null);
      setPasswordFormError(null);
    });
    if (firstInvalid !== undefined) {
      focusField(firstInvalid);
      return;
    }

    const submittedValues = values;
    const submittedPassword = password;
    save.mutate(
      {
        profile: plan.saveProfile ? toUpdateInput(values, kind, saved.photo_url) : null,
        password: plan.savePassword ? toPasswordInput(password) : null,
      },
      {
        onSuccess: (result) => {
          applyResult(result, submittedValues, submittedPassword);
        },
        onError: (error) => {
          // PUT /api/me failed, so the password call never ran. A 401 maps to
          // nothing: SessionBridge logs out (ADR-03).
          const mapped = mapProfileError(error, visibleFields);
          const fieldErrors = mapped.fields;
          const field = visibleFields.find((f) => fieldErrors?.[f] !== undefined);
          if (fieldErrors !== undefined && field !== undefined) {
            flushSync(() => {
              setErrors((prev) => ({ ...prev, ...fieldErrors }));
            });
            focusField(field);
            return;
          }
          if (mapped.form === undefined) return;
          const message = mapped.form;
          flushSync(() => {
            setFormError(message);
          });
          formErrorRef.current?.focus();
        },
      },
    );
  }

  // Shown only while there is still a reason to block: the reset above reaches
  // the router in a later transition render, so without `guarding` here the
  // prompt would stay on screen next to the "saved" toast until it lands.
  let prompt: LeavePromptProps | null = null;
  if (blocker.state === 'blocked' && guarding) {
    prompt = {
      onStay: () => {
        blocker.reset();
      },
      onLeave: () => {
        blocker.proceed();
      },
    };
  }
  const showBar = dirty || prompt !== null;

  return (
    <>
      <form
        ref={formRef}
        noValidate
        className={cx(styles.form, showBar && styles.withBar)}
        onSubmit={handleSubmit}
      >
        {formError !== null && (
          <Alert ref={formErrorRef} tabIndex={-1} tone="error">
            {formError}
          </Alert>
        )}
        <PersonalSection
          bind={bind}
          kind={kind}
          savedName={saved.name}
          photoUrl={saved.photo_url}
        />
        <EducationSection bind={bind} kind={kind} />
        <CareerSection bind={bind} kind={kind} />
        <PasswordSection
          bind={bind}
          formError={passwordFormError}
          formErrorRef={passwordErrorRef}
        />
        {savedOnce && !dirty && <p className={styles.allSaved}>{ALL_SAVED_TEXT}</p>}
        {showBar && <SaveBar saving={save.isPending} onDiscard={handleDiscard} prompt={prompt} />}
      </form>
      {/* Always mounted: its status region must be in the page before the
          message is written into it, or screen readers may not announce it. */}
      <Toast
        dismissLabel={TOAST_DISMISS_LABEL}
        onDismiss={closeToast}
        onMouseEnter={() => {
          if (toast !== null) setHoveredToast(toast.id);
        }}
        onMouseLeave={() => {
          setHoveredToast(null);
        }}
        onFocus={() => {
          if (toast !== null) setFocusedToast(toast.id);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusedToast(null);
        }}
      >
        {toast?.text ?? null}
      </Toast>
    </>
  );
}
