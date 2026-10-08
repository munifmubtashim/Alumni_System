import type { AlumniListItem } from '@alumni/shared';
import { useMemo, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BRAND_NAME } from '@/config/brand';
import { TrashIcon } from './AdminIcons';
import { GONE_TEXT } from './AlumniDrawer';
import { mapDeleteError } from './deleteErrors';
import { useDeleteAlumni } from './mutations';
import { alumniName } from './rowText';

export const DELETE_CONFIRM_LABEL = 'Delete alumni';

/** "Delete <name>?", the dialog's title and accessible name. */
function deleteTitle(name: string): string {
  return `Delete ${name}?`;
}

/** "<name> deleted", the success toast. */
function deletedText(name: string): string {
  return `${name} deleted`;
}

export const DELETE_DESCRIPTION = `This permanently removes their profile, posts, and comments from ${BRAND_NAME}. This action can't be undone.`;

/**
 * The row the dialog is open for, plus the Delete button that opened it. Pass
 * a new object per open: a new target clears the last error.
 */
export interface DeleteTarget {
  row: AlumniListItem;
  trigger: HTMLElement;
}

export interface DeleteAlumniDialogProps {
  open: boolean;
  target: DeleteTarget;
  /**
   * Sets `open` to false. Gets the opener: a later refetch may remove its row,
   * and the page then moves focus from <body> to the list heading itself.
   */
  onClose: (opener: HTMLElement) => void;
  /** Shows a success toast on the page. */
  onToast: (text: string) => void;
  /** The list heading's id: the focus target after a delete. */
  listHeadingId: string;
}

/**
 * The S6 delete confirmation on the ConfirmDialog primitive (danger tone,
 * trash icon). Focus starts on Cancel. "Delete alumni" calls
 * DELETE /api/admin/alumni/:id; while it runs the button is busy and Escape
 * and Cancel are ignored, and a second click sends nothing. On success the
 * dialog stays until the table has refetched without the row, then closes
 * with a toast and focus on the "Alumni" heading (the row's button is gone,
 * G35). A failure keeps the dialog open with the message in an Alert, which
 * gets focus; a 404 (deleted meanwhile) closes with "This alumni no longer
 * exists". Cancel sends focus back to the row's Delete button.
 */
export function DeleteAlumniDialog({
  open,
  target,
  onClose,
  onToast,
  listHeadingId,
}: DeleteAlumniDialogProps) {
  const [current, setCurrent] = useState(target);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  // A ref too, so a second click before the re-render still sends nothing.
  const deletingRef = useRef(false);
  // The target whose row is gone: focus then goes to the list heading on close.
  const goneRef = useRef<DeleteTarget | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const remove = useDeleteAlumni();

  // A new target is a new open: start over (state adjusted during render).
  if (target !== current) {
    setCurrent(target);
    setError(null);
  }

  const { row, trigger } = target;
  const name = alumniName(row);

  // Read by the dialog only as it closes (a getter, not a stored element).
  const returnFocusRef = useMemo<RefObject<HTMLElement | null>>(
    () => ({
      get current() {
        if (goneRef.current !== target && trigger.isConnected) return trigger;
        return document.getElementById(listHeadingId);
      },
    }),
    [target, trigger, listHeadingId],
  );

  function setDeletingNow(next: boolean) {
    deletingRef.current = next;
    setDeleting(next);
  }

  function close() {
    onClose(trigger);
  }

  function finish(toast: string) {
    goneRef.current = target;
    flushSync(() => {
      setDeletingNow(false);
    });
    onToast(toast);
    close();
  }

  function handleError(failure: unknown) {
    const mapped = mapDeleteError(failure);
    if (mapped.gone === true) {
      finish(GONE_TEXT);
      return;
    }
    flushSync(() => {
      setDeletingNow(false);
      setError(mapped.message ?? null);
    });
    // The busy button was disabled, so focus may have dropped; the Alert also
    // announces itself (role="alert").
    if (mapped.message !== undefined) errorRef.current?.focus();
  }

  function handleConfirm() {
    if (deletingRef.current) return;
    flushSync(() => {
      setDeletingNow(true);
      setError(null);
    });
    remove.mutate(row.id, {
      onSuccess: () => {
        finish(deletedText(name));
      },
      onError: handleError,
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !deletingRef.current) close();
      }}
      title={deleteTitle(name)}
      description={DELETE_DESCRIPTION}
      confirmLabel={DELETE_CONFIRM_LABEL}
      onConfirm={handleConfirm}
      loading={deleting}
      tone="danger"
      icon={<TrashIcon />}
      finalFocus={returnFocusRef}
    >
      {error !== null && (
        <Alert ref={errorRef} tone="error" tabIndex={-1}>
          {error}
        </Alert>
      )}
    </ConfirmDialog>
  );
}
