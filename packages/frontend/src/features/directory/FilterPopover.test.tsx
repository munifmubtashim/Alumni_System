import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterPopover, type FilterPopoverProps } from './FilterPopover';

function setup(overrides: Partial<FilterPopoverProps> = {}) {
  const onApply = vi.fn();
  const validate = vi.fn((value: string) => (value === '' ? 'Enter a name.' : undefined));
  render(
    <FilterPopover
      label="Department"
      fieldLabel="Department"
      helperText="The exact name; capitals don't matter."
      maxLength={100}
      validate={validate}
      onApply={onApply}
      {...overrides}
    />,
  );
  const trigger = screen.getByRole('button', { name: 'Department' });
  return { trigger, onApply, validate, user: userEvent.setup() };
}

async function openPanel(user: ReturnType<typeof userEvent.setup>, trigger: HTMLElement) {
  await user.click(trigger);
  await screen.findByRole('dialog', { name: 'Department filter' });
  const field = screen.getByRole('textbox', { name: 'Department' });
  await waitFor(() => {
    expect(field).toHaveFocus();
  });
  return field;
}

describe('FilterPopover', () => {
  it('opens a named panel with a labeled field, helper text and Apply', async () => {
    const { trigger, user } = setup();
    const field = await openPanel(user, trigger);

    expect(field).toHaveAttribute('maxLength', '100');
    expect(field).toHaveAccessibleDescription("The exact name; capitals don't matter.");
    expect(screen.getByRole('button', { name: 'Apply' })).toHaveAttribute('type', 'submit');
  });

  it('Enter applies the trimmed value and closes the panel', async () => {
    const { trigger, onApply, user } = setup();
    await openPanel(user, trigger);

    await user.keyboard('  Computer Science {Enter}');

    expect(onApply).toHaveBeenCalledExactlyOnceWith('Computer Science');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('a click on Apply applies too', async () => {
    const { trigger, onApply, user } = setup();
    await openPanel(user, trigger);

    await user.keyboard('Economics');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledExactlyOnceWith('Economics');
  });

  it('an invalid value shows its message, keeps the panel open and does not apply', async () => {
    const { trigger, onApply, user } = setup();
    const field = await openPanel(user, trigger);

    await user.keyboard('{Enter}');

    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(/Enter a name\./);

    await user.keyboard('E');
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('Escape closes without applying and returns focus to the pill', async () => {
    const { trigger, onApply, user } = setup();
    await openPanel(user, trigger);

    await user.keyboard('Economics{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(onApply).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('starts empty each time it opens', async () => {
    const { trigger, user } = setup();
    await openPanel(user, trigger);
    await user.keyboard('{Enter}');
    await user.keyboard('Econ{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    const field = await openPanel(user, trigger);

    expect(field).toHaveValue('');
    expect(field).not.toHaveAttribute('aria-invalid');
  });
});
