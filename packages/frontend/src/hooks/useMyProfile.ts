import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSetAtom } from "jotai";
import type { ChangePasswordInput, MyProfile, UpdateMyProfileInput } from "@alumni/shared";
import { changeMyPassword, getMyProfile, updateMyProfile } from "../services/meApi";
import { accountAtom, toNavAccount } from "../store/accountAtom";
import { postsAtom } from "../store/postsAtom";
import { toProfileError, type ProfileError } from "./useAlumniProfile";

const serverMessage = (err: unknown): string | undefined =>
  axios.isAxiosError(err) ? err.response?.data?.message : undefined;

export function useMyProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfileError | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const setFeed = useSetAtom(postsAtom);
  // Keeps the header's avatar/name in sync with the profile.
  const setAccount = useSetAtom(accountAtom);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await getMyProfile();
      setProfile(loaded);
      setAccount(toNavAccount(loaded));
    } catch (err) {
      setError(toProfileError(err));
    } finally {
      setLoading(false);
    }
  }, [setAccount]);

  useEffect(() => {
    load();
  }, [load]);

  // Rejects with { message } so the form can show the server's validation error.
  const save = async (input: UpdateMyProfileInput): Promise<MyProfile> => {
    setSaving(true);
    try {
      const updated = await updateMyProfile(input);
      setProfile(updated);
      setAccount(toNavAccount(updated));
      // Keep the cached feed's author name/photo in sync with the new profile.
      setFeed((prev) =>
        prev.map((p) =>
          p.user_id === updated.user_id
            ? { ...p, author_name: updated.name, author_photo: updated.photo_url }
            : p,
        ),
      );
      return updated;
    } catch (err) {
      throw { message: serverMessage(err) ?? "Couldn't save your profile. Please try again." };
    } finally {
      setSaving(false);
    }
  };

  // Rejects with { message } (e.g. "Current password is incorrect") for the modal to show.
  const changePassword = async (input: ChangePasswordInput): Promise<void> => {
    setChangingPassword(true);
    try {
      await changeMyPassword(input);
    } catch (err) {
      throw { message: serverMessage(err) ?? "Couldn't change your password. Please try again." };
    } finally {
      setChangingPassword(false);
    }
  };

  return { profile, loading, error, reload: load, save, saving, changePassword, changingPassword };
}
