import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Timeline } from './Timeline';

describe('Timeline', () => {
  it('renders each entry as a list item with its title and detail', () => {
    render(
      <Timeline
        items={[
          { id: 'a', title: 'Lead · Terra', detail: 'Since forever' },
          { id: 'b', title: 'Designer · Nimbus' },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    const [first] = items;
    if (first === undefined) throw new Error('no first entry');
    expect(within(first).getByText('Lead · Terra')).toBeInTheDocument();
    expect(within(first).getByText('Since forever')).toBeInTheDocument();
    expect(items[1]).toHaveTextContent(/^Designer · Nimbus$/);
  });

  it('draws a dot on every entry and a connecting line on all but the last', () => {
    const { container } = render(
      <Timeline
        items={[
          { id: 'a', title: 'One' },
          { id: 'b', title: 'Two' },
          { id: 'c', title: 'Three' },
        ]}
      />,
    );
    const items = container.querySelectorAll('li');
    expect(container.querySelectorAll('[data-part="dot"]')).toHaveLength(3);
    expect(items[0]?.querySelector('[data-part="line"]')).not.toBeNull();
    expect(items[1]?.querySelector('[data-part="line"]')).not.toBeNull();
    expect(items[2]?.querySelector('[data-part="line"]')).toBeNull();
  });

  it('hides the dots and lines from assistive tech', () => {
    const { container } = render(<Timeline items={[{ id: 'a', title: 'One' }]} />);
    const dot = container.querySelector('[data-part="dot"]');
    expect(dot?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows a single entry without a line', () => {
    const { container } = render(<Timeline items={[{ id: 'a', title: 'Only' }]} />);
    expect(container.querySelector('[data-part="line"]')).toBeNull();
  });

  it('shows the note as a paragraph after the list, outside it', () => {
    render(<Timeline items={[{ id: 'a', title: 'One' }]} note="Ten years of work." />);
    const note = screen.getByText('Ten years of work.');
    expect(note.tagName).toBe('P');
    expect(note.closest('ul')).toBeNull();
  });

  it('shows only the note when there are no entries', () => {
    render(<Timeline items={[]} note="Just text." />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('Just text.')).toBeInTheDocument();
  });

  it('renders nothing with no entries and no note', () => {
    const { container } = render(<Timeline items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders markup in the note as literal text', () => {
    const { container } = render(<Timeline items={[]} note="<b>x</b>" />);
    expect(screen.getByText('<b>x</b>')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
  });
});
