import { SegmentedControl, type SegmentedControlOption } from '../SegmentedControl';

/** Same union as the store's theme preference; app code maps between them. */
export type ThemeToggleValue = 'light' | 'dark' | 'system';

const OPTIONS: readonly SegmentedControlOption<ThemeToggleValue>[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

// Same names as the full variant; the icons replace the visible text only.
const COMPACT_OPTIONS: readonly SegmentedControlOption<ThemeToggleValue>[] = [
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
  { value: 'system', label: 'System', icon: <MonitorIcon /> },
];

export interface ThemeToggleProps {
  value: ThemeToggleValue;
  onValueChange: (value: ThemeToggleValue) => void;
  /** Accessible name for the radio group. */
  label?: string;
  /**
   * `full` (default) shows the words; `compact` shows a sun, moon and monitor
   * icon, each still named Light / Dark / System and with that name in a
   * tooltip on hover and focus.
   */
  variant?: 'full' | 'compact';
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
  variant = 'full',
  className,
}: ThemeToggleProps) {
  return (
    <SegmentedControl<ThemeToggleValue>
      label={label}
      options={variant === 'compact' ? COMPACT_OPTIONS : OPTIONS}
      value={value}
      onValueChange={onValueChange}
      className={className}
    />
  );
}

// Feather-style line icons; stroke follows the option's text colour.
const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

function SunIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
