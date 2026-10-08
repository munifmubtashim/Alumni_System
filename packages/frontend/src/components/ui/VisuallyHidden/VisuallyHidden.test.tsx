import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders its text in a span by default, still in the accessibility tree', () => {
    render(<VisuallyHidden>Only for screen readers</VisuallyHidden>);
    const text = screen.getByText('Only for screen readers');
    expect(text.tagName).toBe('SPAN');
    expect(text).toHaveClass('visuallyHidden');
  });

  it('can be a label that names a field', () => {
    render(
      <>
        <VisuallyHidden as="label" htmlFor="q">
          Search alumni
        </VisuallyHidden>
        <input id="q" />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Search alumni' })).toBeInTheDocument();
  });

  it('passes role and className through', () => {
    render(
      <VisuallyHidden as="p" role="status" className="extra">
        3 results
      </VisuallyHidden>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('3 results');
    expect(status).toHaveClass('visuallyHidden', 'extra');
  });
});
