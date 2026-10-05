import { useEffect, type CSSProperties } from 'react';
import { Link, useRouteError } from 'react-router';
import { Card } from '@/components/ui/Card';

// Inline token references keep this tiny fallback to one file.
const TITLE_STYLE: CSSProperties = { font: 'var(--text-heading-md)' };
const LINK_STYLE: CSSProperties = { color: 'var(--accent)', font: 'var(--text-label)' };

/** Minimal message shown when a route fails to render. Not a page. */
export function RouteError() {
  const error = useRouteError();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error(error);
    }
  }, [error]);

  return (
    <Card as="section" aria-labelledby="route-error-title">
      <h1 id="route-error-title" style={TITLE_STYLE}>
        Something went wrong.
      </h1>
      <p>
        <Link to="/" style={LINK_STYLE}>
          Go to the home page
        </Link>
      </p>
    </Card>
  );
}
