import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { cx } from '../cx';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible name for the radio group. */
  label: string;
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}

/**
 * Controlled single choice shown as a pill of segments. A radio group under
 * the hood: Tab reaches the checked option, arrow keys move and select.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup<T>
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        onValueChange(next);
      }}
      className={cx(styles.track, className)}
    >
      {options.map((option) => (
        <Radio.Root<T>
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
