import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Textarea } from '.';

describe('Textarea', () => {
  it('is found by its label', () => {
    render(<Textarea label="Bio" />);
    expect(screen.getByLabelText('Bio')).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('has 4 rows by default and takes a caller rows value', () => {
    const { rerender } = render(<Textarea label="Bio" />);
    expect(screen.getByLabelText('Bio')).toHaveAttribute('rows', '4');
    rerender(<Textarea label="Bio" rows={8} />);
    expect(screen.getByLabelText('Bio')).toHaveAttribute('rows', '8');
  });

  it('uses the helper text as the accessible description', () => {
    render(<Textarea label="Bio" helperText="A few lines about you." />);
    expect(screen.getByLabelText('Bio')).toHaveAccessibleDescription('A few lines about you.');
  });

  it('has no description without helper text', () => {
    render(<Textarea label="Bio" />);
    expect(screen.getByLabelText('Bio')).not.toHaveAttribute('aria-describedby');
  });

  it('keeps a caller aria-describedby alongside the helper', () => {
    render(
      <>
        <p id="extra">Optional.</p>
        <Textarea label="Bio" helperText="Shown on your profile." aria-describedby="extra" />
      </>,
    );
    expect(screen.getByLabelText('Bio')).toHaveAccessibleDescription(
      'Optional. Shown on your profile.',
    );
  });

  it('respects an explicit id', () => {
    render(<Textarea label="Bio" id="bio" />);
    expect(screen.getByLabelText('Bio')).toHaveAttribute('id', 'bio');
  });

  it('gives each instance its own id', () => {
    render(
      <>
        <Textarea label="Bio" />
        <Textarea label="Experience" />
      </>,
    );
    expect(screen.getByLabelText('Bio').id).not.toBe(screen.getByLabelText('Experience').id);
  });

  it('updates its value as the user types, across lines', async () => {
    const user = userEvent.setup();
    render(<Textarea label="Bio" />);
    const textarea = screen.getByLabelText('Bio');
    await user.type(textarea, 'Line one{Enter}Line two');
    expect(textarea).toHaveValue('Line one\nLine two');
  });

  it('is not editable when disabled', async () => {
    const user = userEvent.setup();
    render(<Textarea label="Bio" defaultValue="Locked" disabled />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toBeDisabled();
    await user.type(textarea, 'x');
    expect(textarea).toHaveValue('Locked');
  });

  it('uses the error as the accessible description and marks the field invalid', () => {
    render(<Textarea label="Bio" error="Bio must be at most 2000 characters." />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toBeInvalid();
    expect(textarea).toHaveAccessibleDescription('Bio must be at most 2000 characters.');
  });

  it('keeps the helper text after the error in the description', () => {
    render(<Textarea label="Bio" helperText="Shown on your profile." error="Too long." />);
    expect(screen.getByLabelText('Bio')).toHaveAccessibleDescription(
      'Too long. Shown on your profile.',
    );
  });

  it('clears aria-invalid and the error description when the error goes away', () => {
    const { rerender } = render(
      <Textarea label="Bio" helperText="Shown on your profile." error="Too long." />,
    );
    rerender(<Textarea label="Bio" helperText="Shown on your profile." />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).not.toHaveAttribute('aria-invalid');
    expect(textarea).toHaveAccessibleDescription('Shown on your profile.');
    expect(screen.queryByText('Too long.')).not.toBeInTheDocument();
  });

  it('treats an empty error as no error', () => {
    render(<Textarea label="Bio" error="" />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).not.toHaveAttribute('aria-invalid');
    expect(textarea).not.toHaveAttribute('aria-describedby');
  });

  it('passes className to the textarea and renders the label in the field', () => {
    render(<Textarea label="Bio" className="extra" />);
    const textarea = screen.getByLabelText('Bio');
    expect(textarea).toHaveClass('textarea', 'extra');
    expect(screen.getByText('Bio').parentElement).toHaveClass('field');
  });
});
