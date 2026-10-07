import type { MyProfile } from '@alumni/shared';

/**
 * Whether to offer Edit and Delete on a post or comment: its author, or an
 * admin (REQ-003). This only decides what to show; the API still checks and
 * answers 403 if the user may not.
 */
export function canModify(
  me: Pick<MyProfile, 'user_id' | 'role'> | undefined,
  authorId: number,
): boolean {
  if (!me) return false;
  return me.user_id === authorId || me.role === 'admin';
}
