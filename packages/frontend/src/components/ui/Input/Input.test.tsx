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
  it('uses the error as the accessible description and marks the field invalid', () => {
    render(<Input label="Email" error="Enter a valid email." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Enter a valid email.');
  });

  it('keeps the helper text after the error in the description', () => {
    render(<Input label="Email" helperText="Work address." error="Required." />);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Required. Work address.');
  });

  it('clears aria-invalid and the error description when the error goes away', () => {
    const { rerender } = render(
      <Input label="Email" helperText="Work address." error="Required." />,
    );
    rerender(<Input label="Email" helperText="Work address." />);
    const input = screen.getByLabelText('Email');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAccessibleDescription('Work address.');
    expect(screen.queryByText('Required.')).not.toBeInTheDocument();
  });

  it('treats an empty error as no error', () => {
    render(<Input label="Email" error="" />);
    const input = screen.getByLabelText('Email');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('renders an end adornment inside the field and pads the input for it', () => {
    render(<Input label="Search" endAdornment={<button type="button">Clear</button>} />);
    const input = screen.getByLabelText('Search');
    const button = screen.getByRole('button', { name: 'Clear' });
    expect(input.parentElement).toHaveClass('control');
    expect(input.parentElement).toContainElement(button);
    expect(input).toHaveClass('withAdornment');
  });

  it('adds no adornment padding without an adornment', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).not.toHaveClass('withAdornment');
  });

  it('renders the label directly in the field', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email').parentElement).toHaveClass('field');
  });
});
