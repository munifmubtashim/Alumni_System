import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchField } from '.';

describe('SearchField', () => {
  it('is a search box named by its label', () => {
    render(<SearchField label="Search alumni" />);
    const box = screen.getByRole('searchbox', { name: 'Search alumni' });
    expect(box).toHaveAttribute('type', 'search');
  });

  it('keeps the label in the document but visually hidden', () => {
    render(<SearchField label="Search alumni" />);
    const label = screen.getByText('Search alumni');
    expect(label.tagName).toBe('LABEL');
    expect(label).toHaveClass('visuallyHidden');
  });

  it('hides the search icon from assistive tech', () => {
    const { container } = render(<SearchField label="Search alumni" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('accepts typing and reports each change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <SearchField
          label="Search alumni"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setValue(event.target.value);
          }}
        />
      );
    }
    render(<Controlled />);
    const box = screen.getByRole('searchbox', { name: 'Search alumni' });

    await user.type(box, 'Ada');

    expect(box).toHaveValue('Ada');
    expect(onChange).toHaveBeenLastCalledWith('Ada');
    await user.clear(box);
    expect(box).toHaveValue('');
  });

  it('passes native props and the ref to the input', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <SearchField
        ref={ref}
        label="Search alumni"
        placeholder="Search by name, company or role"
        maxLength={100}
        className="extra"
      />,
    );
    const box = screen.getByRole('searchbox', { name: 'Search alumni' });
    expect(ref.current).toBe(box);
    expect(box).toHaveAttribute('maxlength', '100');
    expect(box).toHaveAttribute('placeholder', 'Search by name, company or role');
    expect(box).toHaveClass('input', 'extra');
  });

  it('respects an explicit id and gives each instance its own otherwise', () => {
    render(
      <>
        <SearchField label="First" id="first" />
        <SearchField label="Second" />
        <SearchField label="Third" />
      </>,
    );
    expect(screen.getByRole('searchbox', { name: 'First' })).toHaveAttribute('id', 'first');
    expect(screen.getByRole('searchbox', { name: 'Second' }).id).not.toBe(
      screen.getByRole('searchbox', { name: 'Third' }).id,
    );
  });

  it('shows no clear button while the box is empty', () => {
    render(<SearchField label="Search alumni" value="" onChange={() => undefined} />);
    expect(screen.queryByRole('button', { name: 'Clear search text' })).not.toBeInTheDocument();
  });

  it('clears a controlled box through onChange and returns focus to it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <SearchField
          label="Search alumni"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setValue(event.target.value);
          }}
        />
      );
    }
    render(<Controlled />);
    const box = screen.getByRole('searchbox', { name: 'Search alumni' });
    await user.type(box, 'Ada');

    await user.click(screen.getByRole('button', { name: 'Clear search text' }));

    expect(onChange).toHaveBeenLastCalledWith('');
    expect(box).toHaveValue('');
    expect(box).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear search text' })).not.toBeInTheDocument();
  });

  it('clears an uncontrolled box too, and takes a custom clear label', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SearchField
        label="Search alumni"
        defaultValue="Ada"
        clearLabel="Clear the search"
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />,
    );
    const box = screen.getByRole('searchbox', { name: 'Search alumni' });

    await user.click(screen.getByRole('button', { name: 'Clear the search' }));

    expect(box).toHaveValue('');
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(box).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear the search' })).not.toBeInTheDocument();
  });

  it('is a real button whose icon is hidden from assistive tech', () => {
    render(<SearchField label="Search alumni" defaultValue="Ada" />);
    const clear = screen.getByRole('button', { name: 'Clear search text' });
    expect(clear).toHaveAttribute('type', 'button');
    expect(clear.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('offers no clear button on a disabled or read-only box', () => {
    render(
      <>
        <SearchField
          label="Disabled"
          value="Ada"
          disabled
          readOnly={false}
          onChange={() => undefined}
        />
        <SearchField label="Read only" value="Ada" readOnly />
      </>,
    );
    expect(screen.queryByRole('button', { name: 'Clear search text' })).not.toBeInTheDocument();
  });

  it('still hands the input to a callback ref', () => {
    let node: HTMLInputElement | null = null;
    render(
      <SearchField
        label="Search alumni"
        ref={(element) => {
          node = element;
        }}
      />,
    );
    expect(node).toBe(screen.getByRole('searchbox', { name: 'Search alumni' }));
  });
});
