import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import type { Post } from "@alumni/shared";
import { postsAtom, postsLoadingAtom, postsHasMoreAtom } from "../store/postsAtom";
import { currentUserAtom } from "../store/userAtom";
import * as postsApi from "../services/postsApi";

const PAGE_SIZE = 20;

export type PostInput = {
  caption: string;
  media_url?: string;
};

export function usePosts() {
  const [items, setItems] = useAtom(postsAtom);
  const [loading, setLoading] = useAtom(postsLoadingAtom);
  const [hasMore, setHasMore] = useAtom(postsHasMoreAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const [error, setError] = useState(false);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);
    try {
      const page = await postsApi.getPosts(PAGE_SIZE, items.length);
      setItems((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...page.filter((p) => !existingIds.has(p.id))];
      });
      if (page.length < PAGE_SIZE) setHasMore(false);
    } catch {
      setError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, items.length]);

  useEffect(() => {
    if (items.length === 0) loadMore();
    else setLoading(false);
  }, []);

  const createPost = async ({ caption, media_url }: PostInput) => {
    if (!currentUser) throw new Error("Not logged in");
    const created = await postsApi.createPost(currentUser.id, caption, media_url || undefined);
    setItems((prev) => [created, ...prev]);
  };

  const updatePost = async (id: number, { caption, media_url }: PostInput) => {
    const updated = await postsApi.updatePost(id, caption, media_url || undefined);
    // PUT returns the bare row, so keep author_name/author_photo from the feed row.
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deletePost = async (id: number) => {
    await postsApi.deletePost(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const canManage = (post: Post) =>
    !!currentUser && (currentUser.id === post.user_id || currentUser.role === "admin");

  return { items, loading, hasMore, error, loadMore, createPost, updatePost, deletePost, canManage };
}
