import { useId } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { BindField } from './fields';
import type { ProfileKind } from './validation';
import styles from './Section.module.css';

export interface CareerSectionProps {
  bind: BindField;
  kind: ProfileKind;
}

/** Current role, company, LinkedIn URL and experience. Hidden for an account with no profile row. */
export function CareerSection({ bind, kind }: CareerSectionProps) {
  const headingId = useId();
  if (kind === 'none') return null;

  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <h2 id={headingId} className={styles.heading}>
        Career
      </h2>
      <div className={styles.row}>
        <Input label="Current role" autoComplete="organization-title" {...bind('job_title')} />
        <Input label="Company" autoComplete="organization" {...bind('current_company')} />
      </div>
      <Input
        label="LinkedIn URL"
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://www.linkedin.com/in/your-name"
        {...bind('linkedin_url')}
      />
      <Textarea label="Experience" rows={5} {...bind('experience')} />
    </section>
  );
}
