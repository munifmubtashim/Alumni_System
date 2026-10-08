import type { AlumniListItem } from '@alumni/shared';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tag } from '@/components/ui/Tag';
import { profilePath } from '@/config/directoryReturn';
import { present } from '@/config/text';
import styles from './PersonRow.module.css';

export interface PersonRowProps {
  person: AlumniListItem;
}

/** "Job title, Company", leaving out whichever part is missing (no stray comma). */
function roleLine(person: AlumniListItem): string | undefined {
  const parts = [present(person.job_title), present(person.current_company)].filter(
    (part): part is string => part !== undefined,
  );
  return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * One person in a short list (Suggested alumni, Mentors available): avatar,
 * name, "job title, company" and a "Mentor" tag when `mentorship_available`
 * is true. The whole row is one link to the profile. It carries no directory
 * router state, so the profile's back link goes to the plain directory. Each
 * line is its own block element so the link's name reads with spaces (G27).
 * In a narrow column the Mentor tag drops under the text (a container query
 * in the CSS), so the role line keeps the full width.
 */
export function PersonRow({ person }: PersonRowProps) {
  const name = present(person.name) ?? '';
  const role = roleLine(person);

  return (
    <Link to={profilePath(person.id)} className={styles.row}>
      <div className={styles.layout}>
        <Avatar
          name={name}
          photoUrl={present(person.photo_url)}
          size="sm"
          className={styles.avatar}
        />
        <div className={styles.identity}>
          <p className={styles.name}>{name}</p>
          {role !== undefined && <p className={styles.role}>{role}</p>}
        </div>
        {person.mentorship_available === true && (
          <div className={styles.tag}>
            <Tag tone="accent">Mentor</Tag>
          </div>
        )}
      </div>
    </Link>
  );
}

/** A placeholder in the row's shape, shown while the list loads. Decorative. */
export function PersonRowSkeleton() {
  return (
    <div aria-hidden="true" className={styles.skeletonRow} data-skeleton="">
      <Skeleton shape="circle" className={styles.skeletonAvatar} />
      <div className={styles.identity}>
        <Skeleton className={styles.skeletonName} />
        <Skeleton className={styles.skeletonRole} />
      </div>
    </div>
  );
}
