import { useId, type ReactNode } from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import styles from './Switch.module.css';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label, tied to the switch with htmlFor (its accessible name). */
  label: ReactNode;
  /** Help text under the label; becomes the switch's accessible description. */
  description?: ReactNode;
  disabled?: boolean;
  /** Id of the switch button; generated when omitted. */
  id?: string;
}

/**
 * A controlled on/off switch with its label and optional help text on the
 * left and the track on the right. Base UI supplies the behaviour: a native
 * button with role="switch" and aria-checked, toggled by click, Space and Enter.
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const descriptionId = `${switchId}-description`;
  const hasDescription = description !== undefined && description !== null && description !== '';

  return (
    <div className={styles.field} data-disabled={disabled ? '' : undefined}>
      <div className={styles.text}>
        <label className={styles.label} htmlFor={switchId}>
          {label}
        </label>
        {hasDescription && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
      </div>
      <BaseSwitch.Root
        id={switchId}
        nativeButton
        render={<button type="button" />}
        checked={checked}
        // Forward only the boolean: Base UI's second eventDetails argument stays out of our API.
        onCheckedChange={(next) => {
          onCheckedChange(next);
        }}
        disabled={disabled}
        aria-describedby={hasDescription ? descriptionId : undefined}
        className={styles.track}
      >
        <BaseSwitch.Thumb className={styles.thumb} />
      </BaseSwitch.Root>
    </div>
  );
}
