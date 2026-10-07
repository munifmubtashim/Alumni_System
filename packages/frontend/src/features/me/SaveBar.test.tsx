import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LEAVE_PROMPT_TEXT } from './LeavePrompt';
import { SAVE_BAR_LABEL, SaveBar, UNSAVED_TEXT } from './SaveBar';

function renderInForm(ui: React.ReactElement, onSubmit = vi.fn()) {
  render(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {ui}
    </form>,
  );
  return onSubmit;
}

describe('SaveBar', () => {
  it('is a labelled region with the message, Discard and a submit Save', async () => {
    const user = userEvent.setup();
    const onDiscard = vi.fn();
    const onSubmit = renderInForm(<SaveBar saving={false} onDiscard={onDiscard} />);

    const bar = screen.getByRole('region', { name: SAVE_BAR_LABEL });
    expect(bar).toHaveTextContent(UNSAVED_TEXT);
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onDiscard).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('shows Saving… and disables both buttons while the save is in flight', () => {
    renderInForm(<SaveBar saving onDiscard={vi.fn()} />);
    const save = screen.getByRole('button', { name: 'Saving…' });
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
  });

  it('asks before leaving in the prompt state, with focus on Keep editing', async () => {
    const user = userEvent.setup();
    const onStay = vi.fn();
    const onLeave = vi.fn();
    renderInForm(<SaveBar saving={false} onDiscard={vi.fn()} prompt={{ onStay, onLeave }} />);

    const group = screen.getByRole('group', { name: LEAVE_PROMPT_TEXT });
    expect(group).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(onLeave).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(onStay).toHaveBeenCalledOnce();
  });

  it('puts focus on Save changes when the prompt closes', async () => {
    const user = userEvent.setup();
    function Host() {
      const [prompting, setPrompting] = useState(true);
      return (
        <SaveBar
          saving={false}
          onDiscard={vi.fn()}
          prompt={
            prompting
              ? {
                  onStay: () => {
                    setPrompting(false);
                  },
                  onLeave: vi.fn(),
                }
              : null
          }
        />
      );
    }
    renderInForm(<Host />);
    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveFocus();
  });
});
