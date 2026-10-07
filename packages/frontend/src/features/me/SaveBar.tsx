import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { InfoIcon } from './InfoIcon';
import { LeavePrompt, type LeavePromptProps } from './LeavePrompt';
import styles from './SaveBar.module.css';

export const SAVE_BAR_LABEL = 'Unsaved changes';
export const UNSAVED_TEXT = 'You have unsaved changes';

export interface SaveBarProps {
  /** True while the save is in flight: Save shows "Saving…" and both buttons wait. */
  saving: boolean;
  /** Restore the saved values. */
  onDiscard: () => void;
  /** Set while a navigation is blocked: the bar asks "Leave without saving?" instead. */
  prompt?: LeavePromptProps | null;
}

/**
 * S5's sticky save bar, rendered by ProfileForm only while there are unsaved
 * changes (or a blocked navigation is waiting for an answer). It must sit
 * inside the <form>: "Save changes" is its submit button.
 *
 * The bar is fixed to the bottom of the viewport, above the phone tab bar
 * (`bottom: var(--tab-bar-height)` from AppShell). A spacer of the same height
 * stays in the page flow, so the bar never covers the last field
 * (LESSON-REQ-007-1). When the prompt closes with focus lost (its buttons
 * unmounted), focus goes to Save changes.
 */
export function SaveBar({ saving, onDiscard, prompt = null }: SaveBarProps) {
  const saveRef = useRef<HTMLButtonElement>(null);
  const prompting = prompt !== null;
  const wasPrompting = useRef(prompting);

  useEffect(() => {
    if (wasPrompting.current && !prompting) {
      const active = document.activeElement;
      if (active === null || active === document.body || !active.isConnected) {
        saveRef.current?.focus();
      }
    }
    wasPrompting.current = prompting;
  }, [prompting]);

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <section aria-label={SAVE_BAR_LABEL} className={styles.bar}>
        {prompt !== null ? (
          <LeavePrompt onStay={prompt.onStay} onLeave={prompt.onLeave} />
        ) : (
          <div className={styles.content}>
            <p className={styles.message}>
              <InfoIcon />
              {UNSAVED_TEXT}
            </p>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                className={styles.action}
                disabled={saving}
                onClick={onDiscard}
              >
                Discard
              </Button>
              <Button
                ref={saveRef}
                type="submit"
                variant="primary"
                className={styles.action}
                loading={saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
