import type { AlumniListItem } from '@alumni/shared';
import { useId, useMemo, useRef, useState, type RefObject, type SubmitEvent } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Drawer, type DrawerChangeReason } from '@/components/ui/Drawer';
import { present } from '@/config/text';
import { mapAdminError } from './adminErrors';
import { AlumniForm } from './AlumniForm';
import { GONE_TEXT } from './rowText';
import { useCreateAlumni, useUpdateAlumni } from './mutations';
import {
  EMPTY_VALUES,
  formFields,
  isFormDirty,
  toCreateInput,
  toUpdateInput,
  validateAlumniForm,
  valuesFromRow,
  type AlumniField,
  type AlumniFormErrors,
  type AlumniFormValues,
} from './validation';
import styles from './AlumniDrawer.module.css';

export const ADD_TITLE = 'Add alumni';
export const EDIT_TITLE = 'Edit alumni';
export const CHANGES_SAVED_TEXT = 'Changes saved';
export const DISCARD_NEW_TEXT = 'Discard this new alumni?';
export const DISCARD_CHANGES_TEXT = 'Discard changes?';

/** "<name> added", the add toast. */
function addedText(name: string): string {
  return `${name} added`;
}

/**
 * What the drawer is open for, plus the button that opened it (focus goes back
 * to it on close while it is still on the page). Pass a new object per open:
 * a new target resets the form.
 */
export type DrawerTarget =
  | { mode: 'add'; trigger: HTMLElement }
  | { mode: 'edit'; row: AlumniListItem; trigger: HTMLElement };

export interface AlumniDrawerProps {
  open: boolean;
  target: DrawerTarget;
  /**
   * Sets `open` to false. Gets the opener: the table may refetch after the
   * drawer has closed and remove the opener's row, and the page then moves
   * focus from <body> to the list heading itself.
   */
  onClose: (opener: HTMLElement) => void;
  /** Shows a success toast on the page. */
  onToast: (text: string) => void;
  /** The list heading's id: the focus target when the opener has left the page. */
  listHeadingId: string;
}

function initialValues(target: DrawerTarget): AlumniFormValues {
  return target.mode === 'edit' ? valuesFromRow(target.row) : EMPTY_VALUES;
}

/**
 * The S6 add/edit drawer. Add creates an account (POST /api/admin/alumni),
 * edit sets the six profile fields (PUT /api/admin/alumni/:id); neither is
 * optimistic; edit's Save changes stays disabled until a value differs from
 * the row (compared trimmed). Errors show when a field is left or the form is submitted, and
 * a failed submit focuses the first invalid field (ADR-04, L-REQ-002-7).
 *
 * While a save is in flight every control is disabled and close requests (×,
 * Escape, backdrop) are ignored; a second click or Enter sends nothing (ADV-004).
 * A close with typed input asks first in the footer (Keep editing / Discard);
 * Escape there goes back to editing. After a save the drawer stays open until
 * the table has refetched, then focus goes back to the opener if it is still on
 * the page, else to the list heading.
 */
export function AlumniDrawer({ open, target, onClose, onToast, listHeadingId }: AlumniDrawerProps) {
  const formId = useId();
  const confirmTextId = useId();
  const { mode } = target;
  const fields = formFields(mode);

  const [current, setCurrent] = useState(target);
  const [initial, setInitial] = useState(() => initialValues(target));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<AlumniFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  // A ref too, so a second click before the re-render still sends nothing.
  const savingRef = useRef(false);

  // A new target is a new open: start over (state adjusted during render, so
  // the old values never flash).
  if (target !== current) {
    const next = initialValues(target);
    setCurrent(target);
    setInitial(next);
    setValues(next);
    setErrors({});
    setFormError(null);
    setConfirming(false);
  }

  const formRef = useRef<HTMLFormElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Where focus goes on close, read by the Drawer only as it closes (a getter,
  // not a stored element): the opener if it is still on the page then, else
  // the list heading. The table's refetch may land in the same render as the
  // close and remove the opener's row.
  const { trigger } = target;
  const returnFocusRef = useMemo<RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        return trigger.isConnected ? trigger : document.getElementById(listHeadingId);
      },
    }),
    [trigger, listHeadingId],
  );
  // Where focus was when the discard question appeared; it goes back there on Keep editing.
  const beforeConfirmRef = useRef<HTMLElement | null>(null);

  const create = useCreateAlumni();
  const update = useUpdateAlumni();
  const dirty = isFormDirty(values, initial, mode);
  // Edit saves only a change: an untouched (or whitespace-only) edit has
  // nothing to send, so Save changes stays disabled until a value differs.
  const nothingToSave = mode === 'edit' && !dirty;

  function close() {
    onClose(trigger);
  }

  function askToDiscard() {
    const active = document.activeElement;
    beforeConfirmRef.current = active instanceof HTMLElement ? active : null;
    flushSync(() => {
      setConfirming(true);
    });
    keepEditingRef.current?.focus();
  }

  function keepEditing() {
    flushSync(() => {
      setConfirming(false);
    });
    const back = beforeConfirmRef.current;
    if (back?.isConnected && back !== document.body) back.focus();
    else cancelRef.current?.focus();
  }

  /** ×, Escape, backdrop and Cancel all come here. */
  function requestClose(reason: DrawerChangeReason | 'cancel') {
    if (savingRef.current) return;
    if (confirming) {
      // The question stays until it is answered; Escape answers "Keep editing".
      if (reason === 'escape-key') keepEditing();
      return;
    }
    if (dirty) askToDiscard();
    else close();
  }

  function focusField(field: AlumniField) {
    const element = formRef.current?.elements.namedItem(field);
    if (element instanceof HTMLElement) element.focus();
  }

  function setSavingNow(next: boolean) {
    savingRef.current = next;
    setSaving(next);
  }

  function handleFieldChange(field: AlumniField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleFieldBlur(field: AlumniField) {
    // Only adds a message: leaving a field must not wipe a server error on it.
    const message = validateAlumniForm(values, mode)[field];
    if (message !== undefined) setErrors((prev) => ({ ...prev, [field]: message }));
  }

  function handleError(error: unknown) {
    const mapped = mapAdminError(error, mode, fields);
    if (mapped.gone === true) {
      flushSync(() => {
        setSavingNow(false);
      });
      onToast(GONE_TEXT);
      close();
      return;
    }
    const fieldErrors = mapped.fields;
    const field = fields.find((f) => fieldErrors?.[f] !== undefined);
    // Render the message (and re-enable the fields) before moving focus.
    flushSync(() => {
      setSavingNow(false);
      if (fieldErrors !== undefined) setErrors((prev) => ({ ...prev, ...fieldErrors }));
      if (mapped.form !== undefined) setFormError(mapped.form);
    });
    if (field !== undefined) focusField(field);
    else if (mapped.form !== undefined) formErrorRef.current?.focus();
  }

  function handleSuccess(text: string) {
    flushSync(() => {
      setSavingNow(false);
    });
    onToast(text);
    close();
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current || confirming || nothingToSave) return;
    const found = validateAlumniForm(values, mode);
    const firstInvalid = fields.find((field) => found[field] !== undefined);
    flushSync(() => {
      setErrors(found);
      setFormError(null);
    });
    if (firstInvalid !== undefined) {
      focusField(firstInvalid);
      return;
    }

    setSavingNow(true);
    if (target.mode === 'add') {
      const input = toCreateInput(values);
      create.mutate(input, {
        onSuccess: (row) => {
          handleSuccess(addedText(present(row.name) ?? input.name));
        },
        onError: handleError,
      });
    } else {
      update.mutate(
        { id: target.row.id, input: toUpdateInput(values) },
        {
          onSuccess: () => {
            handleSuccess(CHANGES_SAVED_TEXT);
          },
          onError: handleError,
        },
      );
    }
  }

  const footer = confirming ? (
    <div className={styles.confirm} role="group" aria-labelledby={confirmTextId}>
      <p id={confirmTextId} className={styles.question}>
        {mode === 'add' ? DISCARD_NEW_TEXT : DISCARD_CHANGES_TEXT}
      </p>
      <div className={styles.actions}>
        <Button ref={keepEditingRef} onClick={keepEditing}>
          Keep editing
        </Button>
        <Button variant="danger" onClick={close}>
          Discard
        </Button>
      </div>
    </div>
  ) : (
    <div className={styles.actions}>
      <Button
        ref={cancelRef}
        disabled={saving}
        onClick={() => {
          requestClose('cancel');
        }}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form={formId}
        variant="primary"
        loading={saving}
        disabled={nothingToSave}
      >
        {mode === 'add' ? 'Add alumni' : 'Save changes'}
      </Button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onOpenChange={(next, reason) => {
        if (!next) requestClose(reason);
      }}
      title={mode === 'add' ? ADD_TITLE : EDIT_TITLE}
      initialFocus={nameRef}
      finalFocus={returnFocusRef}
      footer={footer}
    >
      <AlumniForm
        id={formId}
        mode={mode}
        values={values}
        errors={errors}
        formError={formError}
        saving={saving}
        formRef={formRef}
        formErrorRef={formErrorRef}
        nameRef={nameRef}
        onFieldChange={handleFieldChange}
        onFieldBlur={handleFieldBlur}
        onSubmit={handleSubmit}
      />
    </Drawer>
  );
}
