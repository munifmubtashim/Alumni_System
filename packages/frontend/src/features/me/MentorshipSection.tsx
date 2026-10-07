import { useId } from 'react';
import { Switch } from '@/components/ui/Switch';
import styles from './Section.module.css';

export const MENTORSHIP_LABEL = 'Available for mentorship';
// S5 says "...and appear in mentor search", but there is no mentor search yet
// (REQ-011 non-goal), so the line names what the switch really shows.
export const MENTORSHIP_HELP =
  'Show a mentorship badge on your profile and a Mentor tag on your directory card.';

export interface MentorshipSectionProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * S5's Mentorship card (alumni only; ProfileForm decides): one switch. Its
 * state is part of the form, counts as an unsaved change and is sent on Save.
 */
export function MentorshipSection({ checked, onCheckedChange }: MentorshipSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <h2 id={headingId} className={styles.heading}>
        Mentorship
      </h2>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        label={MENTORSHIP_LABEL}
        description={MENTORSHIP_HELP}
      />
    </section>
  );
}
