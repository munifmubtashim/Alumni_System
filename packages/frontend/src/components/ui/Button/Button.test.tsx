import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, type ButtonVariant } from '.';

describe('Button', () => {
  it('defaults to the secondary variant and type="button"', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('type', 'button');
  });

  it.each<ButtonVariant>(['primary', 'secondary', 'ghost'])('sets data-variant="%s"', (variant) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('data-variant', variant);
  });

  it('keeps an explicit type', () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  it('merges a passed className with its own', () => {
    render(<Button className="extra">Go</Button>);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveClass('extra');
    expect(button.classList.length).toBeGreaterThan(1);
  });

  it('fires onClick on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Join</Button>);

    const button = screen.getByRole('button', { name: 'Join' });

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Join
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Join' });
    expect(button).toBeDisabled();
    await user.click(button);
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards ref to the button element', () => {
    let node: HTMLButtonElement | null = null;
    render(
      <Button
        ref={(el) => {
          node = el;
        }}
      >
        Ref
      </Button>,
    );
    expect(node).toBe(screen.getByRole('button', { name: 'Ref' }));
  });
});
