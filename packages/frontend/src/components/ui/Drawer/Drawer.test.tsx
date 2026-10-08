import { useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Drawer, type DrawerChangeReason } from '.';

interface HarnessProps {
  /** Return false to refuse a close request (e.g. unsaved input). */
  allowClose?: (reason: DrawerChangeReason) => boolean;
  onChange?: (open: boolean, reason: DrawerChangeReason) => void;
  withFooter?: boolean;
  focusName?: boolean;
}

function Harness({ allowClose = () => true, onChange, withFooter, focusName }: HarnessProps) {
  const [open, setOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Add item
      </button>
      <Drawer
        open={open}
        onOpenChange={(next, reason) => {
          onChange?.(next, reason);
          if (next || allowClose(reason)) setOpen(next);
        }}
        title="Add item"
        initialFocus={focusName ? nameRef : undefined}
        footer={
          withFooter ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </button>
          ) : undefined
        }
      >
        <label htmlFor="name">Name</label>
        <input id="name" ref={nameRef} />
      </Drawer>
    </>
  );
}

async function openDrawer(props: HarnessProps = {}) {
  const user = userEvent.setup();
  render(<Harness {...props} />);
  const trigger = screen.getByRole('button', { name: 'Add item' });
  await user.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'Add item' });
  return { user, trigger, dialog };
}

describe('Drawer', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a modal dialog named by its h2 title', async () => {
    const { dialog } = await openDrawer();
    expect(dialog).toHaveClass('panel');
    expect(screen.getByRole('heading', { level: 2, name: 'Add item' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('moves focus inside on open (the first focusable: the close button)', async () => {
    await openDrawer();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    });
  });

  it('focuses initialFocus when given', async () => {
    await openDrawer({ focusName: true });
    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toHaveFocus();
    });
  });

  // Base UI sets no aria-modal: it hides everything outside the portal
  // (aria-hidden + data-base-ui-inert) and traps Tab with focus guards. jsdom
  // does not run the guards' redirect, so the Tab loop is checked in a browser.
  it('hides the rest of the page from assistive tech while open', async () => {
    const { trigger } = await openDrawer();
    expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Add item' })).not.toBeInTheDocument();
  });

  it.each<[string, (user: ReturnType<typeof userEvent.setup>) => Promise<void>, string]>([
    [
      'the close button',
      (user) => user.click(screen.getByRole('button', { name: 'Close' })),
      'close-press',
    ],
    ['Escape', (user) => user.keyboard('{Escape}'), 'escape-key'],
  ])('closes on %s, reports why and returns focus to the trigger', async (_label, act, reason) => {
    const onChange = vi.fn();
    const { user, trigger } = await openDrawer({ onChange });

    await act(user);

    expect(onChange).toHaveBeenLastCalledWith(false, reason);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('closes on a backdrop click (outside-press)', async () => {
    const onChange = vi.fn();
    const { user } = await openDrawer({ onChange });
    const backdrop = document.querySelector('.backdrop');
    expect(backdrop).not.toBeNull();

    await user.click(backdrop as HTMLElement);

    expect(onChange).toHaveBeenLastCalledWith(false, 'outside-press');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('stays open when the caller refuses the close request', async () => {
    const onChange = vi.fn();
    const { user } = await openDrawer({ onChange, allowClose: () => false });

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('dialog', { name: 'Add item' })).toBeInTheDocument();
  });

  it('renders the footer bar only when given', async () => {
    const { user } = await openDrawer({ withFooter: true });
    expect(document.querySelector('.footer')).toContainElement(
      screen.getByRole('button', { name: 'Cancel' }),
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('has no footer bar without a footer', async () => {
    await openDrawer();
    expect(document.querySelector('.footer')).toBeNull();
  });

  it('uses closeLabel as the close button name', async () => {
    const user = userEvent.setup();
    function Labelled() {
      const [open, setOpen] = useState(true);
      return (
        <Drawer open={open} onOpenChange={setOpen} title="Edit" closeLabel="Close panel">
          body
        </Drawer>
      );
    }
    render(<Labelled />);
    await user.click(await screen.findByRole('button', { name: 'Close panel' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
