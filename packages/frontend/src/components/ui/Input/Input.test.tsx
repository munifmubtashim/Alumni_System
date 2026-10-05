import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from '.';

describe('Input', () => {
  it('is found by its label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInstanceOf(HTMLInputElement);
  });

  it('uses the helper text as the accessible description', () => {
    render(<Input label="Email" helperText="We never share it." />);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('We never share it.');
  });

  it('has no description without helper text', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-describedby');
  });

  it('keeps a caller aria-describedby alongside the helper', () => {
    render(
      <>
        <p id="extra">Required.</p>
        <Input label="Email" helperText="Work address." aria-describedby="extra" />
      </>,
    );
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Required. Work address.');
  });

  it('respects an explicit id', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
  });

  it('gives each instance its own id', () => {
    render(
      <>
        <Input label="First" />
        <Input label="Second" />
      </>,
    );
    expect(screen.getByLabelText('First').id).not.toBe(screen.getByLabelText('Second').id);
  });

  it('updates its value as the user types', async () => {
    const user = userEvent.setup();
    render(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    await user.type(input, 'a@b.co');
    expect(input).toHaveValue('a@b.co');
  });

  it('is not editable when disabled', async () => {
    const user = userEvent.setup();
    render(<Input label="Student ID" defaultValue="Locked" disabled />);
    const input = screen.getByLabelText('Student ID');
    expect(input).toBeDisabled();
    await user.type(input, 'x');
    expect(input).toHaveValue('Locked');
  });
});
