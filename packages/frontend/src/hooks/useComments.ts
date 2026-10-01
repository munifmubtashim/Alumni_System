import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAtomValue, useSetAtom } from "jotai";
import type { Comment } from "@alumni/shared";
import * as commentsApi from "../services/commentsApi";
import { postsAtom } from "../store/postsAtom";
import { currentUserAtom } from "../store/userAtom";

const errorMessage = (error: unknown, fallback: string) =>
  (axios.isAxiosError(error) && error.response?.data?.message) || fallback;

// Comments for one post; loads only once `enabled` (the section is opened).
export function useComments(postId: number, enabled: boolean) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const currentUser = useAtomValue(currentUserAtom);
  const setFeed = useSetAtom(postsAtom);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setComments(await commentsApi.getComments(postId));
      setLoaded(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (enabled && !loaded) load();
  }, [enabled, loaded, load]);

  // Keep the cached feed's count in sync once we know the real list.
  useEffect(() => {
    if (!loaded) return;
    setFeed((prev) =>
      prev.map((p) => (p.id === postId && p.comment_count !== comments.length ? { ...p, comment_count: comments.length } : p)),
    );
  }, [comments.length, loaded, postId, setFeed]);

  // Both reject with an Error whose message can be shown to the user.
  const add = async (content: string, parentId?: number) => {
    try {
      const created = await commentsApi.addComment(postId, { content, parent_id: parentId });
      setComments((prev) => [...prev, created]);
    } catch (err) {
      throw new Error(errorMessage(err, "Couldn't post your comment."));
    }
  };

  const remove = async (id: number) => {
    try {
      await commentsApi.deleteComment(id);
      // Replies are deleted with their comment on the server.
      setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
    } catch (err) {
      throw new Error(errorMessage(err, "Couldn't delete the comment."));
    }
  };

  const canDelete = (comment: Comment) =>
    !!currentUser && (currentUser.id === comment.user_id || currentUser.role === "admin");

  return { comments, loading, loaded, error, reload: load, add, remove, canDelete };
}
