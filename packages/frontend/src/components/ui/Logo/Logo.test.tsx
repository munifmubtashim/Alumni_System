import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from '.';

const HEX = /#[0-9a-f]{3,8}\b/i;

describe('Logo', () => {
  it('is an image named by its label when there is no wordmark', () => {
    render(<Logo label="Alma" />);
    expect(screen.getByRole('img', { name: 'Alma' })).toBeInTheDocument();
    expect(screen.queryByText('Alma')).toBeNull();
  });

  it('shows the label as visible text with a wordmark, and no extra image', () => {
    const { container } = render(<Logo label="Alma" showWordmark />);
    expect(screen.getByText('Alma')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    expect(container).toHaveTextContent(/^Alma$/);
  });

  it.each([false, true])('exposes no name when decorative (wordmark: %s)', (showWordmark) => {
    const { container } = render(<Logo label="Alma" decorative showWordmark={showWordmark} />);
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('aria-label');
    expect(screen.queryByRole('img')).toBeNull();
    // queryByText ignores aria-hidden, so check any wordmark sits under the hidden root.
    const wordmark = screen.queryByText('Alma');
    if (wordmark) expect(root).toContainElement(wordmark);
  });

  it('hides the SVG itself from assistive tech', () => {
    const { container } = render(<Logo label="Alma" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(['sm', 'md'] as const)('sets data-size="%s"', (size) => {
    render(<Logo label="Alma" size={size} />);
    expect(screen.getByRole('img', { name: 'Alma' })).toHaveAttribute('data-size', size);
  });

  it('defaults to the small size', () => {
    render(<Logo label="Alma" />);
    expect(screen.getByRole('img', { name: 'Alma' })).toHaveAttribute('data-size', 'sm');
  });

  it('renders no hex colour in its markup', () => {
    const { container } = render(<Logo label="Alma" showWordmark size="md" />);
    expect(container.innerHTML).not.toMatch(HEX);
  });

  it('colours the mark and glyph through token classes', () => {
    const { container } = render(<Logo label="Alma" />);
    expect(container.querySelector('rect')).toHaveClass('mark');
    expect(container.querySelector('path')).toHaveClass('glyph');
  });

  it('merges a passed className', () => {
    render(<Logo label="Alma" className="extra" />);
    expect(screen.getByRole('img', { name: 'Alma' })).toHaveClass('extra');
  });
});
