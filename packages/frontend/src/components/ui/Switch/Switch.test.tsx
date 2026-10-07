import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from '.';

const LABEL = 'Available for mentorship';
const HELP = 'Show a mentorship badge on your profile.';

function Controlled({ onChange }: { onChange: (checked: boolean) => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <Switch
      label={LABEL}
      description={HELP}
      checked={checked}
      onCheckedChange={(next) => {
        setChecked(next);
        onChange(next);
      }}
    />
  );
}

describe('Switch', () => {
  it('is a switch named by its label and described by its help text', () => {
    render(<Switch label={LABEL} description={HELP} checked onCheckedChange={vi.fn()} />);

    // Query by role: Base UI also renders a hidden native input (G05).
    const toggle = screen.getByRole('switch', { name: LABEL });
    expect(toggle).toHaveAccessibleDescription(HELP);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle).toHaveAttribute('type', 'button');
  });

  it('has no description when no help text is given', () => {
    render(<Switch label={LABEL} checked={false} onCheckedChange={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: LABEL });
    expect(toggle).not.toHaveAttribute('aria-describedby');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('uses the given id, so the label still points at the switch', () => {
    render(<Switch id="mentor" label={LABEL} checked={false} onCheckedChange={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: LABEL });
    expect(toggle).toHaveAttribute('id', 'mentor');
    expect(screen.getByText(LABEL)).toHaveAttribute('for', 'mentor');
  });

  it('stays controlled: a click reports the new value but does not flip it', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label={LABEL} checked={false} onCheckedChange={onCheckedChange} />);

    await user.click(screen.getByRole('switch', { name: LABEL }));

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch', { name: LABEL })).toHaveAttribute('aria-checked', 'false');
  });

  it('Tab reaches it and Space toggles it on and off', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await user.tab();
    const toggle = screen.getByRole('switch', { name: LABEL });
    expect(toggle).toHaveFocus();

    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('toggles when the label is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await user.click(screen.getByText(LABEL));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('switch', { name: LABEL })).toHaveAttribute('aria-checked', 'true');
  });

  it('does nothing when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label={LABEL} checked={false} disabled onCheckedChange={onCheckedChange} />);

    const toggle = screen.getByRole('switch', { name: LABEL });
    expect(toggle).toBeDisabled();
    await user.click(toggle);
    await user.click(screen.getByText(LABEL));

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('marks the track and thumb for the checked styles', () => {
    render(<Switch label={LABEL} checked onCheckedChange={vi.fn()} />);

    const toggle = screen.getByRole('switch', { name: LABEL });
    expect(toggle).toHaveClass('track');
    expect(toggle).toHaveAttribute('data-checked');
    expect(toggle.querySelector('.thumb')).toHaveAttribute('data-checked');
  });
});
