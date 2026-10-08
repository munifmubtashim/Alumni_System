import { useState, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog, type ConfirmDialogTone } from '.';

interface HarnessProps {
  onConfirm?: () => void;
  onChange?: (open: boolean) => void;
  loading?: boolean;
  tone?: ConfirmDialogTone;
  icon?: ReactNode;
  children?: ReactNode;
}

function Harness({ onConfirm = vi.fn(), onChange, loading, tone, icon, children }: HarnessProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Delete item
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          onChange?.(next);
          setOpen(next);
        }}
        title="Delete Ada?"
        description="This can't be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        loading={loading}
        tone={tone}
        icon={icon}
      >
        {children}
      </ConfirmDialog>
    </>
  );
}

async function openDialog(props: HarnessProps = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  const trigger = screen.getByRole('button', { name: 'Delete item' });
  await user.click(trigger);
  const dialog = await screen.findByRole('alertdialog', { name: 'Delete Ada?' });
  return { user, trigger, dialog };
}

describe('ConfirmDialog', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('is an alertdialog named by its h2 title and described by its text', async () => {
    const { dialog } = await openDialog();
    expect(screen.getByRole('heading', { level: 2, name: 'Delete Ada?' })).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription("This can't be undone.");
  });

  it('puts initial focus on Cancel', async () => {
    await openDialog();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    });
  });

  it('hides the rest of the page from assistive tech while open', async () => {
    const { trigger } = await openDialog();
    expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it.each<[string, (user: ReturnType<typeof userEvent.setup>) => Promise<void>]>([
    ['Escape', (user) => user.keyboard('{Escape}')],
    ['Cancel', (user) => user.click(screen.getByRole('button', { name: 'Cancel' }))],
  ])('closes on %s and returns focus to the trigger', async (_label, act) => {
    const onChange = vi.fn();
    const { user, trigger } = await openDialog({ onChange });

    await act(user);

    expect(onChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('does not close on a backdrop click', async () => {
    const onChange = vi.fn();
    const { user } = await openDialog({ onChange });
    const backdrop = document.querySelector('.backdrop');
    expect(backdrop).not.toBeNull();

    await user.click(backdrop as HTMLElement);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog', { name: 'Delete Ada?' })).toBeInTheDocument();
  });

  it('calls onConfirm from the confirm button and leaves closing to the caller', async () => {
    const onConfirm = vi.fn();
    const { user } = await openDialog({ onConfirm });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('disables the confirm button while loading', async () => {
    const onConfirm = vi.fn();
    const { user } = await openDialog({ onConfirm, loading: true });
    const confirm = screen.getByRole('button', { name: 'Delete' });

    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    await user.click(confirm);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('uses the danger button and tone for tone="danger", primary otherwise', async () => {
    const { dialog } = await openDialog({ tone: 'danger' });
    expect(dialog).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute(
      'data-variant',
      'danger',
    );
  });

  it('defaults to the neutral tone with a primary confirm button', async () => {
    const { dialog } = await openDialog();
    expect(dialog).toHaveAttribute('data-tone', 'neutral');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute(
      'data-variant',
      'primary',
    );
  });

  it('shows a decorative icon beside the title only when given', async () => {
    const { user } = await openDialog({ icon: <svg data-testid="trash" /> });
    const icon = screen.getByTestId('trash').parentElement;
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveClass('icon');

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  });

  it('renders children (e.g. an error) inside the dialog', async () => {
    const { dialog } = await openDialog({ children: <p role="alert">Could not delete.</p> });
    expect(dialog).toContainElement(screen.getByRole('alert'));
  });
});
