import type { AlumniListItem } from '@alumni/shared';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { AlumniCard, AlumniCardSkeleton } from './AlumniCard';
import styles from './ResultsGrid.module.css';

/** Skeleton cards shown while loading, unless the caller asks for another count. */
export const DEFAULT_SKELETON_COUNT = 6;

export type ResultsGridProps =
  | { loading: true; skeletonCount?: number; items?: never }
  | { loading?: false; items: AlumniListItem[]; skeletonCount?: never };

/**
 * The results grid (auto-fill columns, 260px minimum). Results are a list of
 * card links. While loading it shows skeleton cards instead, hidden from
 * assistive tech, with aria-busy and a "Loading alumni" status.
 */
export function ResultsGrid(props: ResultsGridProps) {
  if (props.loading === true) {
    const count = props.skeletonCount ?? DEFAULT_SKELETON_COUNT;
    return (
      <div aria-busy="true">
        <VisuallyHidden as="p" role="status">
          Loading alumni…
        </VisuallyHidden>
        <div className={styles.grid}>
          {Array.from({ length: count }, (_, index) => (
            <AlumniCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ul className={styles.grid}>
      {props.items.map((alumnus) => (
        <li key={alumnus.id} className={styles.item}>
          <AlumniCard alumnus={alumnus} />
        </li>
      ))}
    </ul>
  );
}
