import { useCallback, useEffect, useState } from "react";
import type { Post } from "@alumni/shared";
import { getPostsByUser } from "../services/postsApi";

// Posts written by one user; waits until a user id is known.
export function useUserPosts(userId: number | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (userId === null) return;
    setLoading(true);
    setError(false);
    try {
      setPosts(await getPostsByUser(userId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { posts, loading, error, reload: load };
}
