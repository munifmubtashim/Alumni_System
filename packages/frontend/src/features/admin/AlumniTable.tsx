import type { AlumniListItem, AlumniSort, SortOrder } from '@alumni/shared';
import { Skeleton } from '@/components/ui/Skeleton';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { cx } from '@/components/ui/cx';
import { ADMIN_PAGE_SIZE } from './queries';
import { RowActions, type RowAction } from './RowActions';
import { alumniName, present } from './rowText';
import styles from './AlumniTable.module.css';

export interface AlumniTableProps {
  /** Id of the heading that names the table ("Alumni"). */
  labelledBy: string;
  /** The page's rows; undefined while the first page loads (skeleton rows). */
  rows: AlumniListItem[] | undefined;
  sort: AlumniSort;
  order: SortOrder;
  onSort: (column: AlumniSort) => void;
  onEdit: RowAction;
  onDelete: RowAction;
  /** False for a row whose Delete is hidden (the signed-in admin's own). Default: all. */
  canDelete?: (row: AlumniListItem) => boolean;
  /** True while a newer page loads behind the rows on screen. */
  stale?: boolean;
}

// S6 shows ↓ on the default, name ascending, so ↓ means ascending.
const ARROW: Record<SortOrder, string> = { asc: '↓', desc: '↑' };
const ARIA_SORT: Record<SortOrder, 'ascending' | 'descending'> = {
  asc: 'ascending',
  desc: 'descending',
};

interface SortHeaderProps {
  column: AlumniSort;
  label: string;
  sort: AlumniSort;
  order: SortOrder;
  onSort: (column: AlumniSort) => void;
}

/** A sortable `<th>`: a button with the arrow on the active column, and aria-sort. */
function SortHeader({ column, label, sort, order, onSort }: SortHeaderProps) {
  const active = column === sort;
  return (
    <th scope="col" className={styles.th} aria-sort={active ? ARIA_SORT[order] : undefined}>
      <button
        type="button"
        className={cx(styles.sortButton, active && styles.sortActive)}
        onClick={() => {
          onSort(column);
        }}
      >
        {label}
        {active && (
          <span aria-hidden="true" className={styles.arrow}>
            {ARROW[order]}
          </span>
        )}
      </button>
    </th>
  );
}

/** The value, or a dash read out as "Not set". */
function cell(value: string | undefined) {
  if (value !== undefined) return value;
  return (
    <>
      <span aria-hidden="true">—</span>
      <VisuallyHidden>Not set</VisuallyHidden>
    </>
  );
}

/**
 * The desktop alumni table (S6, from 48rem; `AlumniCardList` replaces it on
 * phones by CSS). Name and Grad. year headers sort on the server. Only the
 * table scrolls sideways when the page is narrow or zoomed.
 */
export function AlumniTable({
  labelledBy,
  rows,
  sort,
  order,
  onSort,
  onEdit,
  onDelete,
  canDelete,
  stale = false,
}: AlumniTableProps) {
  const headerProps = { sort, order, onSort };
  return (
    <div className={styles.scroller}>
      <table
        className={cx(styles.table, stale && styles.stale)}
        aria-labelledby={labelledBy}
        aria-busy={rows === undefined || stale ? true : undefined}
      >
        <thead>
          <tr>
            <SortHeader column="name" label="Name" {...headerProps} />
            <SortHeader column="graduationYear" label="Grad. year" {...headerProps} />
            <th scope="col" className={styles.th}>
              Department
            </th>
            <th scope="col" className={styles.th}>
              University
            </th>
            <th scope="col" className={styles.th}>
              Mentor
            </th>
            <th scope="col" className={styles.th}>
              <VisuallyHidden>Actions</VisuallyHidden>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows === undefined
            ? Array.from({ length: ADMIN_PAGE_SIZE }, (_, index) => (
                <tr key={index} aria-hidden="true">
                  <td className={styles.td}>
                    <Skeleton className={styles.skeletonName} />
                  </td>
                  <td className={styles.td}>
                    <Skeleton className={styles.skeletonShort} />
                  </td>
                  <td className={styles.td}>
                    <Skeleton />
                  </td>
                  <td className={styles.td}>
                    <Skeleton />
                  </td>
                  <td className={styles.td}>
                    <Skeleton className={styles.skeletonShort} />
                  </td>
                  <td className={styles.td} />
                </tr>
              ))
            : rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row" className={cx(styles.td, styles.name)}>
                    {alumniName(row)}
                  </th>
                  <td className={styles.td}>
                    {cell(
                      row.graduation_year === null || row.graduation_year === undefined
                        ? undefined
                        : String(row.graduation_year),
                    )}
                  </td>
                  <td className={styles.td}>{cell(present(row.department))}</td>
                  <td className={styles.td}>{cell(present(row.university))}</td>
                  <td className={styles.td}>{row.mentorship_available === true ? 'Yes' : 'No'}</td>
                  <td className={cx(styles.td, styles.actionsCell)}>
                    <RowActions
                      row={row}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      canDelete={canDelete?.(row) ?? true}
                    />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
