import type { Alumni } from '@alumni/shared';
import { useId } from 'react';
import { present } from '@/config/text';
import { educationLine } from './format';
import styles from './Section.module.css';
import { Timeline, type TimelineItem } from './Timeline';

export interface EducationSectionProps {
  alumni: Pick<Alumni, 'university' | 'department' | 'graduation_year' | 'degree' | 'start_year'>;
}

/**
 * The one Education entry the data supports: the university as the title and
 * `educationLine` under it ("B.Sc. Product Design · 2013–2017", or
 * "Department · Class of YYYY" when there is no degree or start year). With no
 * university, that line becomes the title. Not rendered when every field is
 * empty (AC7; REQ-011 AC11).
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
