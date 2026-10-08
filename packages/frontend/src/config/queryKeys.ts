/**
 * Query-key roots that more than one feature needs. The owning feature starts
 * its keys with the root; the admin page invalidates by root after a write
 * (lazy features never import each other, ADR-08), so a renamed root changes
 * both sides at once instead of leaving admin writes refreshing nothing.
 */
/** Directory searches and `/alumni/:id` profiles: `['alumni', 'search' | 'profile', …]`. */
export const ALUMNI_QUERY_ROOT = 'alumni';
/** One person's recent posts on `/alumni/:id`: `['posts', 'user', userId]`. */
export const POSTS_QUERY_ROOT = 'posts';
/** The feed's posts and comment threads: `['feed', 'posts' | 'comments', …]`. */
export const FEED_QUERY_ROOT = 'feed';
