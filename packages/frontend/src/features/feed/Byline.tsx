import { Link } from 'react-router';
import { Avatar, type AvatarSize } from '@/components/ui/Avatar';
import { relativeTime } from '@/config/relativeTime';
import { authorProfilePath, isEdited, isoDate } from './feedFormat';
import styles from './Byline.module.css';

/** Shown when a row came back without its joined author name. */
export const UNKNOWN_AUTHOR = 'Unknown member';

export interface AuthorProps {
  name: string | undefined;
  photo?: string | null;
  /** The author's alumni id; without one the author is plain text. */
  alumniId: number | null | undefined;
  className?: string;
}

/**
 * The author's avatar, linked to their profile when they have one. The link is
 * a mouse shortcut only (out of the tab order and hidden): the name beside it
 * is the same link for keyboards and screen readers.
 */
export function AuthorAvatar({
  name,
  photo,
  alumniId,
  className,
  size,
}: AuthorProps & { size: AvatarSize }) {
  const href = authorProfilePath(alumniId);
  const avatar = (
    <Avatar name={name ?? UNKNOWN_AUTHOR} photoUrl={photo} size={size} className={className} />
  );
  if (href === undefined) return avatar;
  return (
    <Link to={href} tabIndex={-1} aria-hidden="true" className={styles.avatarLink}>
      {avatar}
    </Link>
  );
}

/** The author's name, a link to their profile when they have one. */
export function AuthorName({ name, alumniId, className }: Omit<AuthorProps, 'photo'>) {
  const href = authorProfilePath(alumniId);
  const text = name ?? UNKNOWN_AUTHOR;
  if (href === undefined) return <span className={className}>{text}</span>;
  return (
    <Link to={href} className={className}>
      {text}
    </Link>
  );
}

export interface TimestampProps {
  created: Date | string | undefined;
  updated: Date | string | undefined;
  /** The time "3 days ago" is measured from; defaults to now. */
  now?: Date;
}

/**
 * "3 days ago" in a `<time dateTime>`, then "· edited" when the row was saved
 * more than a second after it was created (an admin edit shows too).
 * Nothing for a missing or invalid date.
 */
export function Timestamp({ created, updated, now }: TimestampProps) {
  const dateTime = isoDate(created);
  const when = dateTime === undefined ? '' : relativeTime(dateTime, now);
  if (dateTime === undefined || when === '') return null;
  return (
    <>
      <time dateTime={dateTime}>{when}</time>
      {isEdited(created, updated) && ' · edited'}
    </>
  );
}
