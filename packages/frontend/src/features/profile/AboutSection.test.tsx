import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from './AboutSection';

describe('AboutSection', () => {
  it('shows the bio under an About heading, as a named region', () => {
    render(<AboutSection alumni={{ bio: 'Designer and mentor.' }} />);
    const region = screen.getByRole('region', { name: 'About' });
    expect(screen.getByRole('heading', { level: 2, name: 'About' })).toBeInTheDocument();
    expect(region).toHaveTextContent('Designer and mentor.');
  });

  it.each([undefined, '', '   '])('is not rendered when the bio is %j', (bio) => {
    const { container } = render(<AboutSection alumni={{ bio }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders markup in the bio as literal text', () => {
    const { container } = render(<AboutSection alumni={{ bio: '<b>x</b>' }} />);
    expect(screen.getByText('<b>x</b>')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
  });
});
