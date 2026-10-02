import { atom } from "jotai";
import type { MyProfile } from "@alumni/shared";

// The signed-in account as shown in the nav bar (avatar, name, email, role).
// Loaded by useAccount and refreshed whenever My Profile loads or saves.
export type NavAccount = Pick<MyProfile, "name" | "email" | "photo_url" | "role">;

export const accountAtom = atom<NavAccount | null>(null);

export const toNavAccount = ({ name, email, photo_url, role }: MyProfile): NavAccount => ({
  name,
  email,
  photo_url,
  role,
});
