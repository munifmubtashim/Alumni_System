import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ForgotPasswordHelp } from './ForgotPasswordHelp';

const MESSAGE =
  "Contact support at support@alma.app from your registered email address, and we'll help you reset your password.";

function toggle() {
  return screen.getByRole('button', { name: 'Forgot password?' });
}

function message() {
  const id = toggle().getAttribute('aria-controls');
  const element = id === null ? null : document.getElementById(id);
  if (element === null) throw new Error('aria-controls does not point at an element');
  return element;
}

describe('ForgotPasswordHelp', () => {
  it('is a plain button, collapsed by default', () => {
    render(<ForgotPasswordHelp />);

    expect(toggle()).toHaveAttribute('type', 'button');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(message()).not.toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the exact support message with a prefilled mailto link on click', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordHelp />);

    await user.click(toggle());

    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(message()).toBeVisible();
    // The link splits the sentence across nodes, so compare the whole text.
    expect(message().textContent).toBe(MESSAGE);
    expect(screen.getByRole('link', { name: 'support@alma.app' })).toHaveAttribute(
      'href',
      'mailto:support@alma.app?subject=Password%20reset%20request',
    );
  });

  it('opens with Enter and closes again, toggling aria-expanded', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordHelp />);

    await user.tab();
    expect(toggle()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(message()).toBeVisible();

    await user.keyboard('{Enter}');
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    expect(message()).not.toBeVisible();
  });
});
