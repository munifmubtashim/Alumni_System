import type { ReactNode } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { cx } from '../cx';
import styles from './Menu.module.css';

export interface MenuProps {
  /** Content of the trigger button; its text is its accessible name unless `label` is given. */
  trigger: ReactNode;
  /** Accessible name for the trigger, for when it holds only an icon or an avatar. */
  label?: string;
  /** `MenuItem` and `MenuLabel` elements. */
  children: ReactNode;
  /** Which edge of the trigger the popup lines up with. */
  align?: 'start' | 'end';
  /** Extra class for the trigger button. */
  className?: string;
}

/**
 * Dropdown menu. Enter, Space or ArrowDown on the trigger opens it; arrow keys
 * move between items; Enter picks one and closes; Escape closes and returns
 * focus to the trigger. Base UI supplies the behaviour; its types stay inside.
 */
export function Menu({ trigger, label, children, align = 'start', className }: MenuProps) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger className={cx(styles.trigger, className)} aria-label={label}>
        {trigger}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        {/* 4px = --space-1; Base UI takes the offset as a number. */}
        <BaseMenu.Positioner align={align} sideOffset={4} className={styles.positioner}>
          <BaseMenu.Popup className={styles.popup}>{children}</BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export interface MenuItemProps {
  children: ReactNode;
  /** Called when the item is picked by click, Enter or Space. The menu then closes. */
  onSelect: () => void;
  disabled?: boolean;
  /** `danger` colours the item with the error token, for destructive actions such as "Delete post". */
  tone?: 'default' | 'danger';
}

export function MenuItem({
  children,
  onSelect,
  disabled = false,
  tone = 'default',
}: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={styles.item}
      data-tone={tone}
      disabled={disabled}
      onClick={() => {
        onSelect();
      }}
    >
      {children}
    </BaseMenu.Item>
  );
}

export interface MenuLabelProps {
  children: ReactNode;
}

/** Non-interactive text inside the popup (e.g. who is signed in). Not focusable. */
export function MenuLabel({ children }: MenuLabelProps) {
  return (
    <BaseMenu.Group>
      <BaseMenu.GroupLabel className={styles.label}>{children}</BaseMenu.GroupLabel>
    </BaseMenu.Group>
  );
}

/** A hairline between groups of items, or between a label and the items. */
export function MenuSeparator() {
  return <BaseMenu.Separator className={styles.separator} />;
}
