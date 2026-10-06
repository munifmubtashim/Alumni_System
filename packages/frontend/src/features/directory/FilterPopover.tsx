import { useState, type ChangeEvent, type Ref, type SubmitEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Popover } from '@/components/ui/Popover';
import styles from './FilterBar.module.css';

export interface FilterPopoverProps {
  /** Pill text, e.g. "Department". Also names the panel ("Department filter"). */
  label: string;
  /** Label of the field inside the panel, e.g. "Graduation year". */
  fieldLabel: string;
  /** Hint under the field. */
  helperText?: string;
  /** Longest accepted text (the API's limit). */
  maxLength: number;
  /** Numeric keypad on phones (graduation year). */
  inputMode?: 'numeric' | 'text';
  /** An error message for `value` (already trimmed), or undefined when it is fine. */
  validate: (value: string) => string | undefined;
  /** Called with the trimmed value when Apply passes validation. The panel closes. */
  onApply: (value: string) => void;
  /** Ref to the pill trigger, so the filter bar can move focus back to it. */
  triggerRef?: Ref<HTMLButtonElement>;
}

/**
 * A filter pill: opens a panel with one labeled field and Apply (a form, so
 * Enter submits). Invalid input shows its message under the field and keeps
 * the panel open. After Apply the pill is replaced by a chip, so focus is not
 * returned to it (the filter bar moves focus to the chip); Escape and an
 * outside click still return focus to the pill.
 */
export function FilterPopover({
  label,
  fieldLabel,
  helperText,
  maxLength,
  inputMode = 'text',
  validate,
  onApply,
  triggerRef,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  function handleOpenChange(next: boolean) {
    if (next) {
      // Every opening starts fresh.
      setValue('');
      setError(undefined);
      setApplied(false);
    }
    setOpen(next);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    setError(undefined);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    const message = validate(trimmed);
    if (message !== undefined) {
      setError(message);
      return;
    }
    setApplied(true);
    setOpen(false);
    onApply(trimmed);
  }

  return (
    <Popover
      trigger={label}
      label={`${label} filter`}
      open={open}
      onOpenChange={handleOpenChange}
      finalFocus={!applied}
      triggerRef={triggerRef}
    >
      <form className={styles.panelForm} noValidate onSubmit={handleSubmit}>
        <Input
          label={fieldLabel}
          value={value}
          onChange={handleChange}
          error={error}
          helperText={helperText}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete="off"
        />
        <Button type="submit" variant="primary" className={styles.apply}>
          Apply
        </Button>
      </form>
    </Popover>
  );
}
