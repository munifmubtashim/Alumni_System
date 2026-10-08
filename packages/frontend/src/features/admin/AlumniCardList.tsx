import type { AlumniListItem } from '@alumni/shared';
import { Skeleton } from '@/components/ui/Skeleton';
import { cx } from '@/components/ui/cx';
import { ADMIN_PAGE_SIZE } from './queries';
import { RowActions, type RowAction } from './RowActions';
import { alumniName, cardDetail } from './rowText';
import styles from './AlumniCardList.module.css';

export interface AlumniCardListProps {
  /** Id of the heading that names the list ("Alumni"). */
  labelledBy: string;
  /** The page's rows; undefined while the first page loads (skeleton cards). */
  rows: AlumniListItem[] | undefined;
  onEdit: RowAction;
  onDelete: RowAction;
  /** False for a row whose Delete is hidden (the signed-in admin's own). Default: all. */
  canDelete?: (row: AlumniListItem) => boolean;
  /** True while a newer page loads behind the cards on screen. */
  stale?: boolean;
}

/**
 * The phone card list (S6-Phone, below 48rem; `AlumniTable` replaces it from
 * 48rem by CSS): name, "year · department" and the two icon buttons.
 */
export function AlumniCardList({
  labelledBy,
  rows,
  onEdit,
  onDelete,
  canDelete,
  stale = false,
}: AlumniCardListProps) {
  if (rows === undefined) {
    return (
      <ul className={styles.list} aria-hidden="true">
        {Array.from({ length: ADMIN_PAGE_SIZE }, (_, index) => (
          <li key={index} className={styles.card}>
            <div className={styles.text}>
              <Skeleton className={styles.skeletonName} />
              <Skeleton className={styles.skeletonDetail} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul
      className={cx(styles.list, stale && styles.stale)}
      aria-labelledby={labelledBy}
      aria-busy={stale ? true : undefined}
    >
      {rows.map((row) => {
        const detail = cardDetail(row);
        return (
          <li key={row.id} className={styles.card}>
            <div className={styles.text}>
              <p className={styles.name}>{alumniName(row)}</p>
              {detail !== '' && <p className={styles.detail}>{detail}</p>}
            </div>
            <RowActions
              row={row}
              onEdit={onEdit}
              onDelete={onDelete}
              canDelete={canDelete?.(row) ?? true}
            />
          </li>
        );
      })}
    </ul>
  );
}
