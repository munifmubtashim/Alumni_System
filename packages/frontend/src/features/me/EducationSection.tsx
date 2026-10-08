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
 * graduation year for students (required, with department). Alumni also get
 * Degree (beside University) and Start year (beside Graduation year), as in
 * S5 (REQ-011). Start year shows at every width, although S5 phone has none
 * (REQ-013): phones stack the fields in form order (University, Degree, Department, Start year, Graduation year).
 * Hidden for an account with no profile row, whose University is in Personal.
 */
export function EducationSection({ bind, kind }: EducationSectionProps) {
  const headingId = useId();
  if (kind === 'none') return null;
  const university = (
    <Input label="University" autoComplete="organization" {...bind('university')} />
  );
  const department = <Input label="Department" {...bind('department')} />;

  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <h2 id={headingId} className={styles.heading}>
        Education
      </h2>
      {kind === 'student' ? (
        <>
          <div className={styles.row}>
            {university}
            {department}
          </div>
          <div className={styles.row}>
            <Input
              label="Expected graduation year"
              inputMode="numeric"
              autoComplete="off"
              {...bind('expected_graduation_year')}
            />
          </div>
        </>
      ) : (
        <>
          <div className={styles.row}>
            {university}
            <Input label="Degree" autoComplete="off" {...bind('degree')} />
          </div>
          {department}
          <div className={styles.row}>
            <Input
              label="Start year"
              inputMode="numeric"
              autoComplete="off"
              {...bind('start_year')}
            />
            <Input
              label="Graduation year"
              inputMode="numeric"
              autoComplete="off"
              {...bind('graduation_year')}
            />
          </div>
        </>
      )}
    </section>
  );
}
