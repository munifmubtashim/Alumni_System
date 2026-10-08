import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from '.';

describe('Card', () => {
  it('renders its children in a div by default', () => {
    render(<Card data-testid="card">Amira Mendes</Card>);
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveTextContent('Amira Mendes');
  });

  it('renders an <article> with as="article"', () => {
    render(
      <Card as="article" aria-label="Profile">
        Body
      </Card>,
    );
    expect(screen.getByRole('article', { name: 'Profile' })).toHaveTextContent('Body');
  });

  it('renders a <section> with as="section"', () => {
    render(
      <Card as="section" aria-label="Events">
        Body
      </Card>,
    );
    expect(screen.getByRole('region', { name: 'Events' })).toBeInTheDocument();
  });

  it('merges a passed className', () => {
    render(
      <Card data-testid="card" className="extra">
        Body
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveClass('extra');
  });
});
