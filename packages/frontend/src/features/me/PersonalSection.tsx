import { useId } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { BindField } from './fields';
import type { ProfileKind } from './validation';
import styles from './Section.module.css';

export interface PersonalSectionProps {
  bind: BindField;
  kind: ProfileKind;
  /** The saved name and photo, for the avatar (initials when there is no photo). */
  savedName: string;
  photoUrl: string | null | undefined;
}

/**
 * Name and About for alumni and students. An account with no profile row
 * (kind 'none', e.g. an admin) has no Education section, so its University
 * field sits here, beside the name (architecture: Role kind). There is no
 * photo upload in the API, so S5's "Change photo" is left out.
 */
export function PersonalSection({ bind, kind, savedName, photoUrl }: PersonalSectionProps) {
  const headingId = useId();
  const name = <Input label="Full name" autoComplete="name" {...bind('name')} />;

  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <h2 id={headingId} className={styles.heading}>
        Personal
      </h2>
      <Avatar name={savedName} photoUrl={photoUrl} className={styles.avatar} />
      {kind === 'none' ? (
        <div className={styles.row}>
          {name}
          <Input label="University" autoComplete="organization" {...bind('university')} />
        </div>
      ) : (
        <>
          {name}
          <Textarea
            label="About"
            helperText="A few lines about you, shown on your public profile."
            {...bind('bio')}
          />
        </>
      )}
    </section>
  );
}
