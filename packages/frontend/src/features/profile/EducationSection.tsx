import type { Alumni } from '@alumni/shared';
import { useId } from 'react';
import { educationLine, present } from './format';
import styles from './Section.module.css';
import { Timeline, type TimelineItem } from './Timeline';

export interface EducationSectionProps {
  alumni: Pick<Alumni, 'university' | 'department' | 'graduation_year'>;
}

/**
 * The one Education entry the data supports: the university as the title and
 * "Department · Class of YYYY" under it. With no university, that line becomes
 * the title. No degree and no year range (AC5). Not rendered when all three
 * fields are empty (AC7).
 */
function educationEntry(alumni: EducationSectionProps['alumni']): TimelineItem | undefined {
  const university = present(alumni.university);
  const line = educationLine(alumni);
  if (university !== undefined) return { id: 'education', title: university, detail: line };
  if (line !== undefined) return { id: 'education', title: line };
  return undefined;
}

export function EducationSection({ alumni }: EducationSectionProps) {
  const headingId = useId();
  const entry = educationEntry(alumni);
  if (entry === undefined) return null;

  return (
    <section
      className={[styles.section, styles.trailingSpace].join(' ')}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className={styles.heading}>
        Education
      </h2>
      <Timeline items={[entry]} />
    </section>
  );
}
