import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle, type ThemeToggleValue } from './ThemeToggle';

function Controlled({
  initial,
  onChange,
  variant,
}: {
  initial: ThemeToggleValue;
  onChange: (value: ThemeToggleValue) => void;
  variant?: 'full' | 'compact';
}) {
  const [value, setValue] = useState(initial);
  return (
    <ThemeToggle
      value={value}
      variant={variant}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('ThemeToggle', () => {
  it('renders a radiogroup named "Theme" with Light, Dark and System', () => {
    render(<ThemeToggle value="dark" onValueChange={vi.fn()} />);

    const group = screen.getByRole('radiogroup', { name: 'Theme' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual([
      'Light',
      'Dark',
      'System',
    ]);
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'false');
  });

  it('uses a custom label as the group name', () => {
    render(<ThemeToggle value="light" onValueChange={vi.fn()} label="Colour theme" />);
    expect(screen.getByRole('radiogroup', { name: 'Colour theme' })).toBeInTheDocument();
  });

  it('calls onValueChange with "dark" when Dark is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ThemeToggle value="light" onValueChange={onValueChange} />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('dark');
  });

  it('stays controlled: selection follows the value prop, not the click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle value="light" onValueChange={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'false');
  });

  it('Tab focuses the checked radio', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle value="system" onValueChange={vi.fn()} />);

    await user.tab();

    expect(screen.getByRole('radio', { name: 'System' })).toHaveFocus();
  });

  it('ArrowRight and ArrowLeft move the selection and report it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initial="light" onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('dark');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('system');

    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('dark');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  });

  it('does not touch the document theme', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="light" onChange={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  describe('compact variant', () => {
    it('keeps the names Light, Dark and System on icon-only radios', () => {
      render(<ThemeToggle value="dark" onValueChange={vi.fn()} variant="compact" />);

      expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
      for (const radio of radios) {
        expect(radio).toHaveTextContent('');
        expect(radio.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      }
      expect(screen.getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    it('shows the option name in a tooltip when it gets keyboard focus', async () => {
      const user = userEvent.setup();
      render(<Controlled initial="system" onChange={vi.fn()} variant="compact" />);

      expect(screen.queryByText('System')).not.toBeInTheDocument();
      await user.tab();
      expect(screen.getByRole('radio', { name: 'System' })).toHaveFocus();
      expect(await screen.findByText('System')).toBeVisible();

      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();
      expect(await screen.findByText('Dark')).toBeVisible();
    });

    it('shows the option name in a tooltip on hover', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle value="light" onValueChange={vi.fn()} variant="compact" />);

      await user.hover(screen.getByRole('radio', { name: 'Dark' }));

      expect(await screen.findByText('Dark')).toBeVisible();
    });

    it('calls onValueChange when an icon is clicked', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<ThemeToggle value="light" onValueChange={onValueChange} variant="compact" />);

      await user.click(screen.getByRole('radio', { name: 'System' }));

      expect(onValueChange).toHaveBeenCalledWith('system');
    });
  });
});
