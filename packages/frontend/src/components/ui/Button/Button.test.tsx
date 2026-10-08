import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Button, ButtonLink, type ButtonVariant } from '.';

describe('Button', () => {
  it('defaults to the secondary variant and type="button"', () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('data-variant', 'secondary');
    expect(button).toHaveAttribute('type', 'button');
  });

  it.each<ButtonVariant>(['primary', 'secondary', 'ghost', 'danger'])(
    'sets data-variant="%s"',
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('data-variant', variant);
    },
  );

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
  it('is busy while loading: disabled, aria-busy, label kept, dot hidden', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Sign in
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('[aria-hidden="true"]')).not.toBeNull();

    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not submit its form while loading', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Button type="submit" loading>
          Sign in
        </Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('drops aria-busy and re-enables when loading ends', () => {
    const { rerender } = render(<Button loading>Save</Button>);
    rerender(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute('aria-busy');
    expect(button.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});

describe('ButtonLink', () => {
  function renderInRouter(ui: ReactNode) {
    const router = createMemoryRouter([{ path: '/', element: ui }], { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
  }

  it('renders a link with the right href and the button styling', () => {
    renderInRouter(
      <ButtonLink to="/register" variant="primary" className="extra">
        Create account
      </ButtonLink>,
    );
    const link = screen.getByRole('link', { name: 'Create account' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/register');
    expect(link).toHaveAttribute('data-variant', 'primary');
    expect(link).toHaveClass('extra');
    expect(link.classList.length).toBeGreaterThan(1);
  });

  it('defaults to the secondary variant', () => {
    renderInRouter(<ButtonLink to="/login">Sign in</ButtonLink>);
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'data-variant',
      'secondary',
    );
  });
});
