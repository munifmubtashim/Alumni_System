import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

type Role = 'student' | 'alumni';

const OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'alumni', label: 'Alumni' },
] as const;

function Controlled({ onChange }: { onChange: (value: Role) => void }) {
  const [value, setValue] = useState<Role>('student');
  return (
    <SegmentedControl<Role>
      label="I am a…"
      options={OPTIONS}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('SegmentedControl', () => {
  it('renders a named radiogroup with one radio per option, in order', () => {
    render(
      <SegmentedControl<Role>
        label="I am a…"
        options={OPTIONS}
        value="alumni"
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'I am a…' })).toBeInTheDocument();
    // Query by role: Base UI also renders hidden native inputs (G05).
    expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual([
      'Student',
      'Alumni',
    ]);
    expect(screen.getByRole('radio', { name: 'Alumni' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Student' })).toHaveAttribute('aria-checked', 'false');
  });

  it('reserves the bold label width through data-label', () => {
    render(
      <SegmentedControl<Role>
        label="I am a…"
        options={OPTIONS}
        value="student"
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Student' })).toHaveAttribute('data-label', 'Student');
  });

  it('calls onValueChange on click and stays controlled', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl<Role>
        label="I am a…"
        options={OPTIONS}
        value="student"
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole('radio', { name: 'Alumni' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('alumni');
    expect(screen.getByRole('radio', { name: 'Student' })).toHaveAttribute('aria-checked', 'true');
  });

  it('Tab reaches the checked option and arrow keys move the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole('radio', { name: 'Student' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('alumni');
    expect(screen.getByRole('radio', { name: 'Alumni' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Alumni' })).toHaveAttribute('aria-checked', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('student');
    expect(screen.getByRole('radio', { name: 'Student' })).toHaveFocus();
  });

  it('passes className to the track', () => {
    render(
      <SegmentedControl<Role>
        label="I am a…"
        options={OPTIONS}
        value="student"
        onValueChange={vi.fn()}
        className="extra"
      />,
    );

    const group = screen.getByRole('radiogroup', { name: 'I am a…' });
    expect(group).toHaveClass('track');
    expect(group).toHaveClass('extra');
  });
});
