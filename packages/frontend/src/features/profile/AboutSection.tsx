import type { Alumni } from '@alumni/shared';
import { useId } from 'react';
import { present } from '@/config/text';
import styles from './Section.module.css';

export interface AboutSectionProps {
  alumni: Pick<Alumni, 'bio'>;
}

/** About: the person's bio as plain text. Not rendered when the bio is empty (AC6). */
export function AboutSection({ alumni }: AboutSectionProps) {
  const headingId = useId();
  const bio = present(alumni.bio);
  if (bio === undefined) return null;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.headingCompact}>
        About
      </h2>
      <p className={styles.text}>{bio}</p>
    </section>
  );
}
