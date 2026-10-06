import { useState, type ComponentPropsWithRef } from 'react';
import { cx } from '../cx';
import styles from './Avatar.module.css';
import { initialsOf } from './initials';

export type AvatarSize = 'lg' | 'md' | 'sm' | 'xs';

export interface AvatarProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** The person's name; the initials come from its first and last word. */
  name: string;
  /** Photo URL. Without one, or if it fails to load, the initials show. */
  photoUrl?: string | null;
  /** lg (the profile header), md (default, result cards), sm, or xs (the header's account button). */
  size?: AvatarSize;
}

/**
 * A round photo or initials. Decorative: the name always sits next to it, so
 * the whole avatar is hidden from assistive tech and the photo has alt="".
 */
export function Avatar({ name, photoUrl, size = 'md', className, ...rest }: AvatarProps) {
  // Remember which URL failed, so a new photoUrl gets a fresh try.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(photoUrl) && photoUrl !== failedUrl;

  return (
    <span {...rest} aria-hidden="true" data-size={size} className={cx(styles.avatar, className)}>
      {showPhoto && photoUrl ? (
        <img
          className={styles.photo}
          src={photoUrl}
          alt=""
          onError={() => {
            setFailedUrl(photoUrl);
          }}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
