import { profilePath } from '@/config/directoryReturn';
import type { FeedComment } from './cacheEdits';
import { POST_MAX_LENGTH } from './constants';

/** A save less than this long after the create is not an edit (the row's own clock). */
const EDITED_AFTER_MS = 1000;

/** The composer's character count shows once this few characters are left. */
export const COUNT_SHOWN_FROM = 200;

function time(value: Date | string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

/** An ISO timestamp for `<time dateTime>`, or undefined for a missing or invalid date. */
export function isoDate(value: Date | string | undefined): string | undefined {
  const ms = time(value);
  return ms === undefined ? undefined : new Date(ms).toISOString();
}

/** True when the row was saved more than a second after it was created. */
export function isEdited(created: Date | string | undefined, updated: Date | string | undefined) {
  const from = time(created);
  const to = time(updated);
  return from !== undefined && to !== undefined && to - from > EDITED_AFTER_MS;
}

/** The thread toggle: "Hide comments" when open, "Comment" for none, else "N comment(s)". */
export function commentToggleLabel(count: number, open: boolean): string {
  if (open) return 'Hide comments';
  if (count <= 0) return 'Comment';
  return count === 1 ? '1 comment' : `${String(count)} comments`;
}

/** "Delete this post and its N comment(s)?" for the inline confirm. */
export function deletePostQuestion(count: number): string {
  return `Delete this post and its ${count === 1 ? '1 comment' : `${String(count)} comments`}?`;
}

/** The first word of a name, or undefined for a blank one. */
export function firstName(name: string | undefined): string | undefined {
  const first = name?.trim().split(/\s+/)[0];
  return first === undefined || first === '' ? undefined : first;
}

/** The composer prompt, with the first name when there is one. */
export function composerPlaceholder(name: string | undefined): string {
  const first = firstName(name);
  return first === undefined ? "What's on your mind?" : `What's on your mind, ${first}?`;
}

/** Characters left in a post, and whether to show that number yet. */
export function postRemaining(text: string): { left: number; show: boolean } {
  const left = POST_MAX_LENGTH - text.length;
  return { left, show: left <= COUNT_SHOWN_FROM };
}

/**
 * The author's profile link: the alumni id (what `/alumni/:id` takes), never
 * the user id. No alumni profile (a student, an admin) gives no link.
 */
export function authorProfilePath(alumniId: number | null | undefined): string | undefined {
  return typeof alumniId === 'number' ? profilePath(alumniId) : undefined;
}

/** A top-level comment and its replies, in thread order. */
export interface ThreadEntry {
  comment: FeedComment;
  replies: FeedComment[];
}

/**
 * Groups a thread (oldest first) into top-level comments with their replies
 * (one level deep). A reply whose parent is not an earlier top-level comment
 * in the list shows on its own, so nothing is ever dropped.
 */
export function groupThread(list: FeedComment[]): ThreadEntry[] {
  const entries: ThreadEntry[] = [];
  const topLevel = new Map<number, ThreadEntry>();
  for (const comment of list) {
    const parent = comment.parent_id ?? null;
    const entry = parent === null ? undefined : topLevel.get(parent);
    if (entry) {
      entry.replies.push(comment);
    } else {
      const own: ThreadEntry = { comment, replies: [] };
      entries.push(own);
      topLevel.set(comment.id, own);
    }
  }
  return entries;
}

/** The React key of a post or comment: the client key outlives the temp id. */
export function itemKey(item: { id: number; clientKey?: string }): string {
  return item.clientKey ?? String(item.id);
}
