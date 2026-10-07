import { useEffect, useId, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { InfoIcon } from './InfoIcon';
import styles from './SaveBar.module.css';

export const LEAVE_PROMPT_TEXT = 'Leave without saving? Your changes will be lost.';

export interface LeavePromptProps {
  /** Keep editing: cancel the blocked navigation. */
  onStay: () => void;
  /** Leave: let the blocked navigation go on; unsaved changes are lost. */
  onLeave: () => void;
}

/**
 * Shown in the save bar's place when a navigation is blocked by unsaved
 * changes (useLeaveGuard). There is no dialog primitive, so it is a labelled
 * group, not a modal. Focus moves to "Keep editing" when it appears: the user
 * just pressed a link elsewhere, and the safe choice is under their hand.
 */
export function LeavePrompt({ onStay, onLeave }: LeavePromptProps) {
  const labelId = useId();
  const stayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    stayRef.current?.focus();
  }, []);

  return (
    <div role="group" aria-labelledby={labelId} className={styles.content}>
      <p id={labelId} className={styles.message}>
        <InfoIcon />
        {LEAVE_PROMPT_TEXT}
      </p>
      <div className={styles.actions}>
        <Button variant="secondary" className={styles.action} onClick={onLeave}>
          Leave
        </Button>
        <Button ref={stayRef} variant="primary" className={styles.action} onClick={onStay}>
          Keep editing
        </Button>
      </div>
    </div>
  );
}
