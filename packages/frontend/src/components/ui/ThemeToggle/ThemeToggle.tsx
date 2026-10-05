import { SegmentedControl, type SegmentedControlOption } from '../SegmentedControl';

/** Same union as the store's theme preference; app code maps between them. */
export type ThemeToggleValue = 'light' | 'dark' | 'system';

const OPTIONS: readonly SegmentedControlOption<ThemeToggleValue>[] = [
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
    <SegmentedControl<ThemeToggleValue>
      label={label}
      options={OPTIONS}
      value={value}
      onValueChange={onValueChange}
      className={className}
    />
  );
}
