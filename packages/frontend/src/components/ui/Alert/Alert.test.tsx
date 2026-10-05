import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Alert } from '.';

describe('Alert', () => {
  it('uses role="alert" for the error tone', () => {
    render(<Alert tone="error">Wrong email or password.</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Wrong email or password.');
    expect(alert).toHaveAttribute('data-tone', 'error');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('uses role="status" for the info tone', () => {
    render(<Alert tone="info">You have been signed out.</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('You have been signed out.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the title before the children', () => {
    render(
      <Alert tone="error" title="Could not sign in">
        Check your connection and try again.
      </Alert>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not sign inCheck your connection and try again.',
    );
    expect(screen.getByText('Could not sign in')).toBeInTheDocument();
  });

  it('renders no title element without a title', () => {
    render(<Alert tone="info">Saved.</Alert>);
    expect(screen.getByRole('status').querySelectorAll('p')).toHaveLength(0);
  });

  it('hides the tone dot from assistive tech and merges className', () => {
    render(
      <Alert tone="info" className="extra">
        Saved.
      </Alert>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveClass('extra');
    expect(status.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });
});
