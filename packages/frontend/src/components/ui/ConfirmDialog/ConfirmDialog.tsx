import { useRef, type ReactNode, type RefObject } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from '../Button';
import styles from './ConfirmDialog.module.css';

/** `danger`: brick icon circle and a danger confirm button; `neutral`: accent and primary. */
export type ConfirmDialogTone = 'neutral' | 'danger';

export interface ConfirmDialogProps {
  /** Controlled open state. */
  open: boolean;
  /**
   * Called when Escape or Cancel asks to close (a backdrop click never does).
   * The dialog stays open until the caller sets `open` to false; ignore the
   * request while `loading` if the action must not be abandoned midway.
   */
  onOpenChange: (open: boolean) => void;
  /** Heading (an h2) and the dialog's accessible name, e.g. "Delete Ada?". */
  title: string;
  /** What will happen; read out with the title as the dialog's description. */
  description: ReactNode;
  /** Text of the confirm button, e.g. "Delete". */
  confirmLabel: string;
  /** Text of the cancel button. */
  cancelLabel?: string;
  /** Called by the confirm button. The caller closes the dialog when done. */
  onConfirm: () => void;
  /** Busy confirm button (disabled, aria-busy) while the action runs. */
  loading?: boolean;
  tone?: ConfirmDialogTone;
  /** Decorative icon in a circle beside the title (hidden from assistive tech). */
  icon?: ReactNode;
  /** Slot under the description, e.g. an error Alert after a failed attempt. */
  children?: ReactNode;
  /**
   * Element focused on close. Default: whatever had focus before it opened.
   * Pass a ref when that element is gone (e.g. the deleted row's button).
   */
  finalFocus?: boolean | RefObject<HTMLElement | null>;
}

/**
 * A small modal that asks before an action (role="alertdialog"). Focus starts
 * on Cancel, so Enter never confirms by accident; Tab stays inside; Escape and
 * Cancel ask to close; a click on the backdrop does nothing. Controlled only.
 * Base UI AlertDialog supplies the behaviour; its types stay inside.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  tone = 'neutral',
  icon,
  children,
  finalFocus,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <BaseAlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
      }}
    >
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className={styles.backdrop} />
        <BaseAlertDialog.Popup
          className={styles.dialog}
          data-tone={tone}
          initialFocus={cancelRef}
          finalFocus={finalFocus}
        >
          <div className={styles.header}>
            {icon !== undefined && icon !== null && (
              <span className={styles.icon} aria-hidden="true">
                {icon}
              </span>
            )}
            <BaseAlertDialog.Title className={styles.title}>{title}</BaseAlertDialog.Title>
          </div>
          <BaseAlertDialog.Description className={styles.description}>
            {description}
          </BaseAlertDialog.Description>
          {children}
          <div className={styles.actions}>
            <BaseAlertDialog.Close ref={cancelRef} render={<Button variant="secondary" />}>
              {cancelLabel}
            </BaseAlertDialog.Close>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  );
}
