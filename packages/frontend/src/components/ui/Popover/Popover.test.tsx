import { createRef, useRef, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Popover } from '.';

function Panel() {
  return (
    <>
      <label htmlFor="dept">Department</label>
      <input id="dept" />
      <button type="button">Apply</button>
    </>
  );
}

function renderUncontrolled() {
  render(
    <>
      <Popover trigger="Department" label="Department filter">
        <Panel />
      </Popover>
      <button type="button">Elsewhere</button>
    </>,
  );
  return screen.getByRole('button', { name: 'Department' });
}

describe('Popover', () => {
  it('renders a closed pill trigger that announces a dialog', () => {
    const trigger = renderUncontrolled();

    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveClass('trigger');
    expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on click as a named dialog and moves focus inside', async () => {
    const user = userEvent.setup();
    const trigger = renderUncontrolled();

    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Department filter' });
    expect(dialog).toHaveClass('panel');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => {
      expect(screen.getByLabelText('Department')).toHaveFocus();
    });
  });

  it.each(['{Enter}', ' '])(
    'opens from the keyboard (%s) and focuses the first field',
    async (key) => {
      const user = userEvent.setup();
      const trigger = renderUncontrolled();

      trigger.focus();
      await user.keyboard(key);

      expect(await screen.findByRole('dialog', { name: 'Department filter' })).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByLabelText('Department')).toHaveFocus();
      });
    },
  );

  it('Escape closes the panel and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const trigger = renderUncontrolled();

    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog');
    await waitFor(() => {
      expect(screen.getByLabelText('Department')).toHaveFocus();
    });
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('a click outside closes the panel', async () => {
    const user = userEvent.setup();
    const trigger = renderUncontrolled();

    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('starts open with defaultOpen', async () => {
    render(
      <Popover trigger="Department" label="Department filter" defaultOpen>
        <Panel />
      </Popover>,
    );
    expect(await screen.findByRole('dialog', { name: 'Department filter' })).toBeInTheDocument();
  });

  it('controlled: the owner closes it (e.g. after Apply) and hears open/close requests', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Popover
          trigger="Department"
          label="Department filter"
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
            }}
          >
            Apply
          </button>
        </Popover>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: 'Department' });

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(await screen.findByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('controlled: stays closed while open is false', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Popover
        trigger="Department"
        label="Department filter"
        open={false}
        onOpenChange={onOpenChange}
      >
        <Panel />
      </Popover>,
    );

    await user.click(screen.getByRole('button', { name: 'Department' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('finalFocus sends focus somewhere other than the trigger on close', async () => {
    const user = userEvent.setup();
    function WithTarget() {
      const target = useRef<HTMLButtonElement>(null);
      return (
        <>
          <Popover trigger="Department" label="Department filter" finalFocus={target}>
            <Panel />
          </Popover>
          <button type="button" ref={target}>
            Target
          </button>
        </>
      );
    }
    render(<WithTarget />);

    await user.click(screen.getByRole('button', { name: 'Department' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Target' })).toHaveFocus();
    });
  });

  it('exposes the trigger through triggerRef', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Popover trigger="Department" label="Department filter" triggerRef={ref}>
        <Panel />
      </Popover>,
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Department' }));
  });
});
