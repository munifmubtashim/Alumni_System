import type { MyProfile } from '@alumni/shared';
import { describe, expect, it } from 'vitest';
import { canModify } from './permissions';

function me(user_id: number, role: MyProfile['role']): Pick<MyProfile, 'user_id' | 'role'> {
  return { user_id, role };
}

describe('canModify', () => {
  it('lets the author change their own post or comment', () => {
    expect(canModify(me(7, 'alumni'), 7)).toBe(true);
  });

  it('lets an admin change anyone’s', () => {
    expect(canModify(me(1, 'admin'), 7)).toBe(true);
  });

  it('refuses another alumni', () => {
    expect(canModify(me(8, 'alumni'), 7)).toBe(false);
  });

  it('refuses a student who is not the author, and allows a student author', () => {
    expect(canModify(me(9, 'student'), 7)).toBe(false);
    expect(canModify(me(7, 'student'), 7)).toBe(true);
  });

  it('refuses when the current user is not known', () => {
    expect(canModify(undefined, 7)).toBe(false);
  });
});
