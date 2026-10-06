import type { ReactNode, Ref, RefObject } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { cx } from '../cx';
import styles from './Popover.module.css';

/** Where focus goes when the panel opens or closes. */
export type PopoverFocusTarget = boolean | RefObject<HTMLElement | null>;

export interface PopoverProps {
  /** Content of the pill trigger; its text is the button's accessible name. A chevron follows it. */
  trigger: ReactNode;
  /** The panel's accessible name (it is a dialog), e.g. "Department filter". */
  label: string;
  /** Panel content. */
  children: ReactNode;
  /** Controlled open state. Leave unset for an uncontrolled popover. */
  open?: boolean;
  /** Initial open state of an uncontrolled popover. */
  defaultOpen?: boolean;
  /** Called when the trigger, Escape or an outside click asks to open or close it. */
  onOpenChange?: (open: boolean) => void;
  /** Which edge of the trigger the panel lines up with. */
  align?: 'start' | 'end';
  /**
   * Element focused when the panel opens. Default: the first focusable element
   * inside (the panel itself on touch, so no keyboard pops up).
   */
  initialFocus?: PopoverFocusTarget;
  /**
   * Element focused when the panel closes. Default: the trigger. Pass `false`
   * when the caller moves focus itself (e.g. the trigger is about to be replaced).
   */
  finalFocus?: PopoverFocusTarget;
  /** Ref to the trigger button, e.g. to focus it later. */
  triggerRef?: Ref<HTMLButtonElement>;
  /** Extra class for the trigger button. */
  className?: string;
}

/**
 * A pill button that opens a non-modal panel. Click, Enter or Space on the
 * trigger opens it and moves focus inside; Escape or a click outside closes it
 * and returns focus to the trigger. Works controlled (`open` + `onOpenChange`)
 * or uncontrolled. Base UI supplies the behaviour; its types stay inside.
 */
export function Popover({
  trigger,
  label,
  children,
  open,
  defaultOpen,
  onOpenChange,
  align = 'start',
  initialFocus,
  finalFocus,
  triggerRef,
  className,
}: PopoverProps) {
  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={
        onOpenChange
          ? (next) => {
              onOpenChange(next);
            }
          : undefined
      }
    >
      <BasePopover.Trigger ref={triggerRef} className={cx(styles.trigger, className)}>
        {trigger}
        <ChevronIcon />
      </BasePopover.Trigger>
      <BasePopover.Portal>
        {/* 8px = --space-2; Base UI takes the offset as a number. */}
        <BasePopover.Positioner align={align} sideOffset={8} className={styles.positioner}>
          <BasePopover.Popup
            aria-label={label}
            initialFocus={initialFocus}
            finalFocus={finalFocus}
            className={styles.panel}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

// Feather-style chevron, coloured by the trigger's secondary ink.
function ChevronIcon() {
  return (
    <svg
      className={styles.chevron}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
