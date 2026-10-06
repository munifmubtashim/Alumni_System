import styles from './HydrateFallback.module.css';

/**
 * Shown inside the shell's `<main>` while a lazy route's code loads on a
 * direct visit. Set it as a static `HydrateFallback` on the lazy route object
 * itself (ADR-08): the router cuts rendering at the nearest route that has
 * one, so on the root it would hide the shell too.
 */
export function HydrateFallback() {
  return (
    <p role="status" className={styles.status}>
      Loading…
    </p>
  );
}
