import type { Alumni } from '@alumni/shared';
import { useId } from 'react';
import { employmentTitle, present } from './format';
import styles from './Section.module.css';
import { Timeline } from './Timeline';

export interface EmploymentSectionProps {
  alumni: Pick<Alumni, 'job_title' | 'current_company' | 'experience'>;
}

/**
 * Employment: one entry "Job title · Company" (either part alone), no dates
 * (AC5), then the free-text experience as a plain paragraph (AC8). Not
 * rendered when job title, company and experience are all empty.
 */
export function EmploymentSection({ alumni }: EmploymentSectionProps) {
  const headingId = useId();
  const title = employmentTitle(alumni);
  const experience = present(alumni.experience);
  if (title === undefined && experience === undefined) return null;

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        Employment
      </h2>
      <Timeline items={title === undefined ? [] : [{ id: 'current', title }]} note={experience} />
    </section>
  );
}
