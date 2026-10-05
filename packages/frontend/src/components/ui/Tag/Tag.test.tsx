import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag, type TagTone } from '.';

const dotOf = (tag: HTMLElement) => tag.querySelector('[aria-hidden="true"]');

describe('Tag', () => {
  it('defaults to the neutral tone', () => {
    render(<Tag>Alumni</Tag>);
    expect(screen.getByText('Alumni')).toHaveAttribute('data-tone', 'neutral');
  });

  it.each<TagTone>(['neutral', 'accent', 'success', 'warning', 'error'])(
    'sets data-tone="%s"',
    (tone) => {
      render(<Tag tone={tone}>Label</Tag>);
      expect(screen.getByText('Label')).toHaveAttribute('data-tone', tone);
    },
  );

  it.each<TagTone>(['success', 'warning', 'error'])('renders a hidden dot for %s', (tone) => {
    render(<Tag tone={tone}>Status</Tag>);
    const tag = screen.getByText('Status');
    expect(dotOf(tag)).toBeInTheDocument();
    expect(tag).toHaveTextContent(/^Status$/);
  });

  it.each<TagTone>(['neutral', 'accent'])('renders no dot for %s', (tone) => {
    render(<Tag tone={tone}>Plain</Tag>);
    expect(dotOf(screen.getByText('Plain'))).toBeNull();
  });

  it('merges a passed className', () => {
    render(<Tag className="extra">Alumni</Tag>);
    expect(screen.getByText('Alumni')).toHaveClass('extra');
  });
});
