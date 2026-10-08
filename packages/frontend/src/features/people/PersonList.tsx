import type { AlumniListItem } from '@alumni/shared';
import { PersonRow, PersonRowSkeleton } from './PersonRow';
import styles from './PersonList.module.css';

/** People as a list of `PersonRow`s, keyed by alumni id. */
export function PersonList({ people }: { people: readonly AlumniListItem[] }) {
  return (
    <ul className={styles.list}>
      {people.map((person) => (
        <li key={person.id}>
          <PersonRow person={person} />
        </li>
      ))}
    </ul>
  );
}

/**
 * `count` skeleton rows in an `aria-busy` box. Pair it with a
 * `SectionLoadingStatus` placed outside it, so the status is announced.
 */
export function PersonListSkeleton({ count }: { count: number }) {
  return (
    <div className={styles.list} aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <PersonRowSkeleton key={index} />
      ))}
    </div>
  );
}
