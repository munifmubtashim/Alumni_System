import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu, MenuItem, MenuLabel } from './Menu';

function renderMenu() {
  const onProfile = vi.fn();
  const onLogout = vi.fn();
  render(
    <Menu trigger="Jane Doe">
      <MenuLabel>Signed in as Alumni</MenuLabel>
      <MenuItem onSelect={onProfile}>Profile</MenuItem>
      <MenuItem onSelect={onLogout}>Log out</MenuItem>
    </Menu>,
  );
  const trigger = screen.getByRole('button', { name: 'Jane Doe' });
  return { trigger, onProfile, onLogout };
}

describe('Menu', () => {
  it('renders a closed trigger with aria-haspopup and aria-expanded', () => {
    const { trigger } = renderMenu();

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Enter on the trigger opens the menu and focuses the first item', async () => {
    const user = userEvent.setup();
    const { trigger } = renderMenu();

    trigger.focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveFocus();
  });

  it('ArrowDown on the trigger opens the menu', async () => {
    const user = userEvent.setup();
    const { trigger } = renderMenu();

    trigger.focus();
    await user.keyboard('{ArrowDown}');

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveFocus();
  });

  it('arrow keys move between items and skip the label', async () => {
    const user = userEvent.setup();
    const { trigger } = renderMenu();

    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toHaveAttribute('data-highlighted');

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveFocus();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByText('Signed in as Alumni')).not.toHaveAttribute('tabindex');
  });

  it('Enter on an item calls onSelect once and closes the menu', async () => {
    const user = userEvent.setup();
    const { trigger, onProfile, onLogout } = renderMenu();

    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onProfile).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking an item calls onSelect', async () => {
    const user = userEvent.setup();
    const { trigger, onLogout } = renderMenu();

    await user.click(trigger);
    await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('Escape closes the menu and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const { trigger, onProfile, onLogout } = renderMenu();

    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(onProfile).not.toHaveBeenCalled();
    expect(onLogout).not.toHaveBeenCalled();
  });

  it('a disabled item cannot be selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Menu trigger="Account">
        <MenuItem onSelect={onSelect} disabled>
          Settings
        </MenuItem>
      </Menu>,
    );

    await user.click(screen.getByRole('button', { name: 'Account' }));
    const item = await screen.findByRole('menuitem', { name: 'Settings' });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    await user.click(item);

    expect(onSelect).not.toHaveBeenCalled();
  });
});
