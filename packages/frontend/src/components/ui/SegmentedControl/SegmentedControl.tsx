import type { ReactNode } from 'react';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Tooltip } from '@base-ui/react/tooltip';
import { cx } from '../cx';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlOption<T extends string> {
  value: T;
  /** Visible text, or with `icon` the option's accessible name and tooltip. */
  label: string;
  /**
   * Shows this icon instead of the label text (decorative: mark it
   * aria-hidden). The label still names the option and appears in a tooltip
   * on hover and focus.
   */
  icon?: ReactNode;
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
      {options.map((option) =>
        option.icon === undefined ? (
          <Radio.Root<T>
            key={option.value}
            value={option.value}
            className={styles.option}
            // Read by the CSS ::after that reserves the bold label's width.
            data-label={option.label}
          >
            {option.label}
          </Radio.Root>
        ) : (
          <IconOption key={option.value} option={option} />
        ),
      )}
    </RadioGroup>
  );
}

/** An icon-only segment: named by aria-label, with the same text in a tooltip. */
function IconOption<T extends string>({ option }: { option: SegmentedControlOption<T> }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={300}
        render={
          <Radio.Root<T>
            value={option.value}
            aria-label={option.label}
            className={cx(styles.option, styles.iconOption)}
          />
        }
      >
        {option.icon}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        {/* 4px = --space-1; Base UI takes the offset as a number. */}
        <Tooltip.Positioner sideOffset={4} className={styles.tooltipPositioner}>
          <Tooltip.Popup className={styles.tooltip}>{option.label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
