import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { cx } from '@/components/ui/cx';
import styles from './EditBox.module.css';

export interface EditBoxProps {
  /** The field's accessible name, e.g. "Edit post". */
  label: string;
  /** The text being edited. */
  initial: string;
  maxLength: number;
  /** Called with the trimmed text; Save is disabled while it is blank or unchanged. */
  onSave: (text: string) => void;
  onCancel: () => void;
  /** `compact` is the smaller comment version. */
  size?: 'regular' | 'compact';
}

/**
 * Inline edit for a post or comment: a textarea with Save and Cancel. It takes
 * focus when it opens (a frame later, after a closing menu has put focus back
 * on its trigger); Escape cancels. Not in S4: built from our own primitives.
 */
export function EditBox({
  label,
  initial,
  maxLength,
  onSave,
  onCancel,
  size = 'regular',
}: EditBoxProps) {
  const id = useId();
  const [draft, setDraft] = useState(initial);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = draft.trim();
  const canSave = trimmed !== '' && trimmed !== initial.trim();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const field = fieldRef.current;
      if (!field) return;
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSave) onSave(trimmed);
  }

  return (
    <form className={cx(styles.form, size === 'compact' && styles.compact)} onSubmit={submit}>
      <VisuallyHidden as="label" htmlFor={id}>
        {label}
      </VisuallyHidden>
      <textarea
        ref={fieldRef}
        id={id}
        className={styles.field}
        value={draft}
        maxLength={maxLength}
        rows={size === 'compact' ? 2 : 3}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          }
        }}
      />
      <div className={styles.actions}>
        <Button className={styles.button} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className={styles.button} disabled={!canSave}>
          Save
        </Button>
      </div>
    </form>
  );
}
