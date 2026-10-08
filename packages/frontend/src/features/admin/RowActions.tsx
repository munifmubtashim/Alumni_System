import type { AlumniListItem } from '@alumni/shared';
import { EditIcon, TrashIcon } from './AdminIcons';
import { alumniName } from './rowText';
import styles from './RowActions.module.css';

/**
 * Called with the row and the button that was pressed, so a dialog can send
 * focus back to it when it closes.
 */
export type RowAction = (row: AlumniListItem, trigger: HTMLButtonElement) => void;

export interface RowActionsProps {
  row: AlumniListItem;
  onEdit: RowAction;
  onDelete: RowAction;
  /** False hides Delete (the signed-in admin's own row; the server refuses it anyway). */
  canDelete?: boolean;
}

/** The two icon buttons of a table row or phone card: "Edit <name>", "Delete <name>". */
export function RowActions({ row, onEdit, onDelete, canDelete = true }: RowActionsProps) {
  const name = alumniName(row);
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={`Edit ${name}`}
        onClick={(event) => {
          onEdit(row, event.currentTarget);
        }}
      >
        <EditIcon className={styles.icon} />
      </button>
      {canDelete && (
        <button
          type="button"
          className={styles.iconButton}
          aria-label={`Delete ${name}`}
          onClick={(event) => {
            onDelete(row, event.currentTarget);
          }}
        >
          <TrashIcon className={styles.icon} />
        </button>
      )}
    </div>
  );
}
