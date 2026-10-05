import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { cx } from '../cx';
import styles from './ThemeToggle.module.css';

/** Same union as the store's theme preference; app code maps between them. */
export type ThemeToggleValue = 'light' | 'dark' | 'system';

const OPTIONS: readonly { value: ThemeToggleValue; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export interface ThemeToggleProps {
  value: ThemeToggleValue;
  onValueChange: (value: ThemeToggleValue) => void;
  /** Accessible name for the radio group. */
  label?: string;
  className?: string;
}

/**
 * Controlled Light / Dark / System switch. Knows nothing about storage or the
 * document theme: the caller owns the value and applies it.
 */
export function ThemeToggle({
  value,
  onValueChange,
  label = 'Theme',
  className,
}: ThemeToggleProps) {
  return (
    <RadioGroup<ThemeToggleValue>
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        onValueChange(next);
      }}
      className={cx(styles.track, className)}
    >
      {OPTIONS.map((option) => (
        <Radio.Root<ThemeToggleValue>
          key={option.value}
          value={option.value}
          className={styles.option}
          // Read by the CSS ::after that reserves the bold label's width.
          data-label={option.label}
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
