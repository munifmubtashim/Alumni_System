import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
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

function joinClasses(...names: (string | undefined)[]): string {
  return names.filter(Boolean).join(' ');
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
      className={joinClasses(styles.track, className)}
    >
      {OPTIONS.map((option) => (
        <Radio.Root<ThemeToggleValue>
          key={option.value}
          value={option.value}
          className={styles.option}
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
