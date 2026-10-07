import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from '.';

describe('Toast', () => {
  it('puts only the message in a status region', () => {
    render(
      <Toast onDismiss={vi.fn()} dismissLabel="Dismiss">
        Profile updated successfully
      </Toast>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/^Profile updated successfully$/);
    expect(status).not.toContainElement(screen.getByRole('button', { name: 'Dismiss' }));
  });

  it('calls onDismiss when the dismiss button is pressed', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Toast onDismiss={onDismiss} dismissLabel="Dismiss message">
        Saved
      </Toast>,
    );
    await user.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('can be dismissed from the keyboard', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Toast onDismiss={onDismiss} dismissLabel="Dismiss">
        Saved
      </Toast>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides the icons from assistive tech and uses no inline styles', () => {
    const { container } = render(
      <Toast onDismiss={vi.fn()} dismissLabel="Dismiss">
        Saved
      </Toast>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    svgs.forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'));
    expect(container.querySelector('[style]')).toBeNull();
  });

  it('does not dismiss itself (the caller owns any timer)', () => {
    vi.useFakeTimers();
    try {
      const onDismiss = vi.fn();
      render(
        <Toast onDismiss={onDismiss} dismissLabel="Dismiss">
          Saved
        </Toast>,
      );
      vi.advanceTimersByTime(60_000);
      expect(onDismiss).not.toHaveBeenCalled();
      expect(screen.getByRole('status')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('passes className and other props to the outer element', () => {
    render(
      <Toast onDismiss={vi.fn()} dismissLabel="Dismiss" className="extra" data-testid="toast">
        Saved
      </Toast>,
    );
    expect(screen.getByTestId('toast')).toHaveClass('toast', 'extra');
  });
});
