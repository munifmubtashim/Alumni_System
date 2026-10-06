import type { AlumniListItem } from '@alumni/shared';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './AlumniCard.module.css';

export interface AlumniCardProps {
  alumnus: AlumniListItem;
}

/** Trimmed text, or undefined when it is missing or blank. */
function present(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

/** "Job title, Company", leaving out whichever part is missing (no stray comma). */
function jobLine(alumnus: Pick<AlumniListItem, 'job_title' | 'current_company'>) {
  const parts = [present(alumnus.job_title), present(alumnus.current_company)].filter(
    (part): part is string => part !== undefined,
  );
  return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * One directory result: the whole card is a single link to the profile.
 * The avatar is aria-hidden, so the link reads as the name, then the details.
 * No Mentor tag (not in this REQ's data).
 */
export function AlumniCard({ alumnus }: AlumniCardProps) {
  const name = present(alumnus.name) ?? '';
  const year = alumnus.graduation_year ?? undefined;
  const department = present(alumnus.department);
  const job = jobLine(alumnus);

  return (
    <Link to={`/alumni/${String(alumnus.id)}`} className={styles.card}>
      <div className={styles.header}>
        <Avatar name={name} photoUrl={present(alumnus.photo_url)} />
        <div className={styles.identity}>
          <p className={styles.name}>{name}</p>
          {year !== undefined && <p className={styles.meta}>Class of {year}</p>}
        </div>
      </div>
      {(department !== undefined || job !== undefined) && (
        <div className={styles.details}>
          {department !== undefined && <p className={styles.meta}>{department}</p>}
          {job !== undefined && <p className={styles.job}>{job}</p>}
        </div>
      )}
    </Link>
  );
}

/** A placeholder in the card's shape, shown while results load. Decorative. */
export function AlumniCardSkeleton() {
  return (
    <div aria-hidden="true" className={styles.card} data-skeleton="">
      <div className={styles.header}>
        <Skeleton shape="circle" />
        <div className={styles.identity}>
          <Skeleton className={styles.skeletonName} />
          <Skeleton className={styles.skeletonMeta} />
        </div>
      </div>
      <div className={styles.details}>
        <Skeleton className={styles.skeletonMeta} />
        <Skeleton className={styles.skeletonJob} />
      </div>
    </div>
  );
}
