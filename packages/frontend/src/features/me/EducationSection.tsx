import { useId } from 'react';
import { Input } from '@/components/ui/Input';
import type { BindField } from './fields';
import type { ProfileKind } from './validation';
import styles from './Section.module.css';

export interface EducationSectionProps {
  bind: BindField;
  kind: ProfileKind;
}

/**
 * University, department and the year: graduation year for alumni, expected
 * graduation year for students (required, with department). Hidden for an
 * account with no profile row, whose University is in Personal.
 */
export function EducationSection({ bind, kind }: EducationSectionProps) {
  const headingId = useId();
  if (kind === 'none') return null;
  const isStudent = kind === 'student';

  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <h2 id={headingId} className={styles.heading}>
        Education
      </h2>
      <div className={styles.row}>
        <Input label="University" autoComplete="organization" {...bind('university')} />
        <Input label="Department" {...bind('department')} />
      </div>
      <div className={styles.row}>
        {isStudent ? (
          <Input
            label="Expected graduation year"
            inputMode="numeric"
            autoComplete="off"
            {...bind('expected_graduation_year')}
          />
        ) : (
          <Input
            label="Graduation year"
            inputMode="numeric"
            autoComplete="off"
            {...bind('graduation_year')}
          />
        )}
      </div>
    </section>
  );
}
