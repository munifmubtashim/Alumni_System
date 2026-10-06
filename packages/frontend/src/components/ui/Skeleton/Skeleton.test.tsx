import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton, type SkeletonShape } from '.';

describe('Skeleton', () => {
  it('is hidden from assistive tech', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no content', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it('defaults to a line', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild).toHaveAttribute('data-shape', 'line');
  });

  it.each<SkeletonShape>(['line', 'block', 'circle'])('sets data-shape="%s"', (shape) => {
    const { container } = render(<Skeleton shape={shape} />);
    expect(container.firstElementChild).toHaveAttribute('data-shape', shape);
  });

  it('merges a passed className', () => {
    const { container } = render(<Skeleton className="extra" />);
    expect(container.firstElementChild).toHaveClass('skeleton', 'extra');
  });
});
