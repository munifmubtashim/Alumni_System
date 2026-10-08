import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from '.';

describe('Chip', () => {
  it('shows its text and a remove button with the given name', () => {
    render(
      <Chip onRemove={vi.fn()} removeLabel="Remove Department: Computer Science">
        Department: Computer Science
      </Chip>,
    );
    expect(screen.getByText('Department: Computer Science')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Department: Computer Science' }),
    ).toHaveAttribute('type', 'button');
  });

  it('calls onRemove when the button is clicked', async () => {
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} removeLabel="Remove Grad. year: 2017">
        Grad. year: 2017
      </Chip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Grad. year: 2017' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove from the keyboard', async () => {
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} removeLabel="Remove University: Lund">
        University: Lund
      </Chip>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Remove University: Lund' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('hands the remove button to removeButtonRef so focus can move to it', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Chip onRemove={vi.fn()} removeLabel="Remove x" removeButtonRef={ref}>
        x
      </Chip>,
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: 'Remove x' }));
  });

  it('keeps the x icon out of the accessible name', () => {
    render(
      <Chip onRemove={vi.fn()} removeLabel="Remove x">
        x
      </Chip>,
    );
    const svg = screen.getByRole('button', { name: 'Remove x' }).querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges a passed className', () => {
    render(
      <Chip onRemove={vi.fn()} removeLabel="Remove x" className="extra">
        x
      </Chip>,
    );
    expect(screen.getByText('x').parentElement).toHaveClass('chip', 'extra');
  });
});
