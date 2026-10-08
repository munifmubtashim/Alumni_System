import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Input } from '../Input';
import { PasswordInput } from '.';

describe('PasswordInput', () => {
  it('starts hidden and toggles the type and the button name', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  });

  it('is reached by Tab from the input and toggles with Enter and Space', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText('Password');

    await user.tab();
    expect(input).toHaveFocus();
    await user.tab();
    const button = screen.getByRole('button', { name: 'Show password' });
    expect(button).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(input).toHaveAttribute('type', 'text');
    await user.keyboard(' ');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('keeps focus in the input after a mouse click on the toggle', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" />);
    const input = screen.getByLabelText('Password');
    await user.click(input);
    expect(input).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('has no aria-pressed and never submits a form', () => {
    render(<PasswordInput label="Password" />);
    const button = screen.getByRole('button', { name: 'Show password' });
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('is as wide as a plain input', () => {
    render(
      <>
        <Input label="Email" type="email" />
        <PasswordInput label="Password" />
      </>,
    );
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    expect(password).toHaveClass('input');
    expect(email).toHaveClass('input');
    expect(password.parentElement).toHaveClass('control');
    expect(password.parentElement?.className).toBe(email.parentElement?.className);
  });

  it('passes label, error and other Input props through', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <PasswordInput
        ref={ref}
        label="Password"
        error="Enter your password."
        autoComplete="current-password"
      />,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter your password.');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    expect(ref.current).toBe(input);
  });
});
