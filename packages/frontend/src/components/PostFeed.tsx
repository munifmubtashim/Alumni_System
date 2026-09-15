import React from "react";
import {
  Flex,
  Listy,
  Spin,
  Typography,
  Empty,
  Card,
  Button,
  Dropdown,
  Modal,
  Input,
  message,
} from "antd";
import { CommentOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import type { Post } from "@alumni/shared";
import { useAtom, useAtomValue } from "jotai";
import { postsAtom, postsLoadingAtom, postsHasMoreAtom } from "../store/postsAtom";
import { currentUserAtom } from "../store/userAtom";
import { createPost, updatePost, deletePost } from "../services/postsApi";

const PAGE_SIZE = 50;

const PostFeed: React.FC = () => {
  const [items, setItems] = useAtom(postsAtom);
  const [loading, setLoading] = useAtom(postsLoadingAtom);
  const [hasMore, setHasMore] = useAtom(postsHasMoreAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const loadingRef = React.useRef(false);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editPost, setEditPost] = React.useState<Post | null>(null);
  const [captionInput, setCaptionInput] = React.useState("");
  const [mediaInput, setMediaInput] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const loadPage = (offset: number) => {
    loadingRef.current = true;
    setLoading(true);
    axios
      .get(`/api/posts?limit=${PAGE_SIZE}&offset=${offset}`)
      .then((res) => {
        const newPosts: Post[] = res.data;
        setItems((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const deduped = newPosts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...deduped];
        });
        if (newPosts.length < PAGE_SIZE) setHasMore(false);
      })
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  };

  React.useEffect(() => {
    if (items.length === 0) loadPage(0);
    else setLoading(false);
  }, []);

  const onScroll: React.UIEventHandler<HTMLElement> = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight > 200 || loadingRef.current || !hasMore) return;
    loadPage(items.length);
  };

  const openCreate = () => {
    setCaptionInput("");
    setMediaInput("");
    setCreateOpen(true);
  };

  const openEdit = (post: Post) => {
    setCaptionInput(post.caption ?? "");
    setMediaInput(post.media_url ?? "");
    setEditPost(post);
  };

  const handleCreate = async () => {
    if (!captionInput.trim()) return;
    setSaving(true);
    try {
      const newPost = await createPost(captionInput, mediaInput || undefined);
      setItems((prev) => [newPost, ...prev]);
      setCreateOpen(false);
    } catch {
      message.error("Failed to create post");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editPost || !captionInput.trim()) return;
    setSaving(true);
    try {
      const updated = await updatePost(editPost.id, captionInput, mediaInput || undefined);
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditPost(null);
    } catch {
      message.error("Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (post: Post) => {
    Modal.confirm({
      title: "Delete this post?",
      okType: "danger",
      onOk: async () => {
        try {
          await deletePost(post.id);
          setItems((prev) => prev.filter((p) => p.id !== post.id));
        } catch {
          message.error("Failed to delete post");
        }
      },
    });
  };

  if (loading && items.length === 0) {
    return (
      <Flex justify="center" style={{ height: 200 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <Flex vertical gap="small" style={{ maxWidth: 600, margin: "0 auto", minHeight: "100%" }}>
      <Flex justify="flex-end" style={{ marginBottom: 8 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          New Post
        </Button>
      </Flex>

      {items.length === 0 ? (
        <Empty description="No posts yet" />
      ) : (
        <Listy<Post>
          virtual
          items={items}
          rowKey="id"
          height={600}
          onScroll={onScroll}
          itemRender={(post) => {
            const canManage =
              currentUser && (currentUser.id === post.user_id || currentUser.role === "admin");

            return (
              <Card style={{ marginBottom: 16 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
                  <Typography.Text strong>
                    {post.author_name ?? `User #${post.user_id}`}
                  </Typography.Text>
                  {canManage && (
                    <Dropdown
                      menu={{
                        items: [
                          { key: "edit", label: "Edit" },
                          { key: "delete", label: "Delete", danger: true },
                        ],
                        onClick: ({ key }) => {
                          if (key === "edit") openEdit(post);
                          if (key === "delete") handleDelete(post);
                        },
                      }}
                    >
                      <Button type="text" icon={<MoreOutlined />} size="small" />
                    </Dropdown>
                  )}
                </Flex>

                <Typography.Paragraph style={{ marginBottom: 8 }}>
                  {post.caption}
                </Typography.Paragraph>

                <Flex justify="space-between" align="center">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {post.comment_count ?? 0} comments
                  </Typography.Text>
                  <Button type="text" icon={<CommentOutlined />} size="small">
                    Comment
                  </Button>
                </Flex>
              </Card>
            );
          }}
        />
      )}

      <Modal
        title="New Post"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => setCreateOpen(false)}
        confirmLoading={saving}
      >
        <Input.TextArea
          rows={4}
          placeholder="What's on your mind?"
          value={captionInput}
          onChange={(e) => setCaptionInput(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Input
          placeholder="Media URL (optional)"
          value={mediaInput}
          onChange={(e) => setMediaInput(e.target.value)}
        />
      </Modal>

      <Modal
        title="Edit Post"
        open={!!editPost}
        onOk={handleEdit}
        onCancel={() => setEditPost(null)}
        confirmLoading={saving}
      >
        <Input.TextArea
          rows={4}
          value={captionInput}
          onChange={(e) => setCaptionInput(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Input value={mediaInput} onChange={(e) => setMediaInput(e.target.value)} />
      </Modal>
    </Flex>
  );
};

export default PostFeed;