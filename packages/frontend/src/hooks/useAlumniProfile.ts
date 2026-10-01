import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import type { Alumni } from "@alumni/shared";
import { getAlumniById } from "../services/alumniApi";
import { useUserPosts } from "./useUserPosts";

export type ProfileError = "not-found" | "unauthorized" | "failed";

export function toProfileError(err: unknown): ProfileError {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  return status === 404 ? "not-found" : status === 401 ? "unauthorized" : "failed";
}

export function useAlumniProfile(id: number | null) {
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfileError | null>(null);
  const userPosts = useUserPosts(alumni?.user_id ?? null);

  const load = useCallback(async () => {
    if (id === null) {
      setError("not-found");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAlumni(await getAlumniById(id));
    } catch (err) {
      setError(toProfileError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    alumni,
    loading,
    error,
    reload: load,
    posts: userPosts.posts,
    postsLoading: userPosts.loading,
    postsError: userPosts.error,
    reloadPosts: userPosts.reload,
  };
}
