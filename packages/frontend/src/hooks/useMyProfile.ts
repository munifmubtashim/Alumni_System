import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSetAtom } from "jotai";
import type { MyProfile, UpdateMyProfileInput } from "@alumni/shared";
import { getMyProfile, updateMyProfile } from "../services/meApi";
import { postsAtom } from "../store/postsAtom";
import { toProfileError, type ProfileError } from "./useAlumniProfile";

export function useMyProfile() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfileError | null>(null);
  const [saving, setSaving] = useState(false);
  const setFeed = useSetAtom(postsAtom);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getMyProfile());
    } catch (err) {
      setError(toProfileError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Rejects with { message } so the form can show the server's validation error.
  const save = async (input: UpdateMyProfileInput): Promise<MyProfile> => {
    setSaving(true);
    try {
      const updated = await updateMyProfile(input);
      setProfile(updated);
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
      const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
      throw { message: message ?? "Couldn't save your profile. Please try again." };
    } finally {
      setSaving(false);
    }
  };

  return { profile, loading, error, reload: load, save, saving };
}
