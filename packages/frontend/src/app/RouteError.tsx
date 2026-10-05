import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router';
import { Card } from '@/components/ui/Card';
import styles from './RouteError.module.css';

/** Minimal message shown when a route fails to render. Not a page. */
export function RouteError() {
  const error = useRouteError();

  // Logged in every build so a production crash leaves a trace in the console.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card as="section" aria-labelledby="route-error-title">
      <h1 id="route-error-title" className={styles.title}>
        Something went wrong.
      </h1>
      <p>
        <Link to="/" className={styles.link}>
          Go to the home page
        </Link>
      </p>
    </Card>
  );
}
