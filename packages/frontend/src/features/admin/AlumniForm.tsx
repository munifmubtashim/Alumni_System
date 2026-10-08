import type { RefObject, SubmitEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import type { AlumniField, AlumniFormErrors, AlumniFormValues, DrawerMode } from './validation';
import styles from './AlumniForm.module.css';

export interface AlumniFormProps {
  /** The form's id: the drawer's footer submit button sits outside it and points here. */
  id: string;
  mode: DrawerMode;
  values: AlumniFormValues;
  errors: AlumniFormErrors;
  /** A save error that belongs to no field, shown at the top. */
  formError: string | null;
  /** While a save is in flight every field is disabled. */
  saving: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  formErrorRef: RefObject<HTMLDivElement | null>;
  /** The Full name input: focused when the drawer opens. */
  nameRef: RefObject<HTMLInputElement | null>;
  onFieldChange: (field: AlumniField, value: string) => void;
  onFieldBlur: (field: AlumniField) => void;
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}

/**
 * The add/edit alumni fields in S6's order: Full name, Email, University and
 * Graduation year (side by side from 48rem), Department, Current role and
 * Company (side by side), Temporary password. Edit hides Email and Temporary
 * password. Controlled and presentational: AlumniDrawer owns the state and
 * the save (ADR-04). Fields are named by their API key, so a failed save can
 * focus one through `form.elements`.
 */
export function AlumniForm({
  id,
  mode,
  values,
  errors,
  formError,
  saving,
  formRef,
  formErrorRef,
  nameRef,
  onFieldChange,
  onFieldBlur,
  onSubmit,
}: AlumniFormProps) {
  const bind = (field: AlumniField) => ({
    name: field,
    value: values[field],
    error: errors[field],
    onChange: (event: { target: { value: string } }) => {
      onFieldChange(field, event.target.value);
    },
    onBlur: () => {
      onFieldBlur(field);
    },
  });

  return (
    <form ref={formRef} id={id} noValidate className={styles.form} onSubmit={onSubmit}>
      {formError !== null && (
        <Alert ref={formErrorRef} tabIndex={-1} tone="error">
          {formError}
        </Alert>
      )}
      <fieldset className={styles.fields} disabled={saving}>
        <Input
          ref={nameRef}
          label="Full name"
          autoComplete="off"
          placeholder="e.g. Hana Kobayashi"
          {...bind('name')}
        />
        {mode === 'add' && (
          <Input
            label="Email"
            type="email"
            autoComplete="off"
            spellCheck={false}
            placeholder="name@example.com"
            {...bind('email')}
          />
        )}
        <div className={styles.pair}>
          <Input
            label="University"
            autoComplete="off"
            placeholder="e.g. Keio University"
            {...bind('university')}
          />
          <Input
            label="Graduation year"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 2021"
            {...bind('graduation_year')}
          />
        </div>
        <Input
          label="Department"
          autoComplete="off"
          placeholder="e.g. International Business"
          {...bind('department')}
        />
        <div className={styles.pair}>
          <Input
            label="Current role"
            autoComplete="off"
            placeholder="e.g. Analyst"
            {...bind('job_title')}
          />
          <Input
            label="Company"
            autoComplete="off"
            placeholder="e.g. Keio Capital"
            {...bind('current_company')}
          />
        </div>
        {mode === 'add' && (
          <PasswordInput
            label="Temporary password"
            autoComplete="new-password"
            helperText="At least 8 characters. Share it with the alumnus; they can change it in Account settings."
            {...bind('password')}
          />
        )}
      </fieldset>
    </form>
  );
}
