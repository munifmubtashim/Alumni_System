import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, initialsOf } from '.';

describe('Avatar', () => {
  it('shows initials from the first and last word when there is no photo', () => {
    const { container } = render(<Avatar name="Priya Rao Shah" />);
    const avatar = container.firstElementChild;
    expect(avatar).toHaveTextContent(/^PS$/);
    expect(avatar?.querySelector('img')).toBeNull();
  });

  it('shows one initial for a one-word name', () => {
    const { container } = render(<Avatar name="Madonna" />);
    expect(container.firstElementChild).toHaveTextContent(/^M$/);
  });

  it('renders an empty circle for an empty name', () => {
    const { container } = render(<Avatar name="  " />);
    const avatar = container.firstElementChild;
    expect(avatar).toBeInTheDocument();
    expect(avatar).toBeEmptyDOMElement();
  });

  it('shows the photo with an empty alt instead of initials', () => {
    const { container } = render(<Avatar name="Amira Mendes" photoUrl="/a.jpg" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/a.jpg');
    expect(img).toHaveAttribute('alt', '');
    expect(container.firstElementChild).not.toHaveTextContent('AM');
  });

  it('falls back to initials when the photo fails to load', () => {
    const { container } = render(<Avatar name="Amira Mendes" photoUrl="/broken.jpg" />);
    const img = container.querySelector('img');
    if (!img) throw new Error('expected an img');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container.firstElementChild).toHaveTextContent(/^AM$/);
  });

  it('is hidden from assistive tech (the name sits next to it)', () => {
    const { container } = render(<Avatar name="Amira Mendes" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('defaults to md and accepts sm', () => {
    const { container, rerender } = render(<Avatar name="A B" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'md');
    rerender(<Avatar name="A B" size="sm" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'sm');
  });

  it('merges a passed className', () => {
    const { container } = render(<Avatar name="A B" className="extra" />);
    expect(container.firstElementChild).toHaveClass('avatar', 'extra');
  });
});

describe('initialsOf', () => {
  it.each([
    ['Amira Mendes', 'AM'],
    ['  jonas   kessler ', 'JK'],
    ['Priya Rao Shah', 'PS'],
    ['Madonna', 'M'],
    ['', ''],
    ['   ', ''],
    ['Élodie Ørsted', 'ÉØ'],
  ])('%j -> %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });

  it('has an xs size for the header account button', () => {
    const { container } = render(<Avatar name="Sophia Marsh" size="xs" />);
    expect(container.firstElementChild).toHaveAttribute('data-size', 'xs');
    expect(container.firstElementChild).toHaveTextContent(/^SM$/);
  });
});
