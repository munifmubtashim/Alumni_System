import React from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Divider, Empty, Flex, Row, Skeleton, Spin, Typography, theme } from "antd";
import type { Post } from "@alumni/shared";
import { usePosts, type PostInput } from "../hooks/usePosts";
import PostCard from "./PostCard";
import PostFormModal from "./PostFormModal";

type ModalState = { mode: "create" } | { mode: "edit"; post: Post } | null;

const PostFeed: React.FC = () => {
  const { items, loading, hasMore, error, loadMore, createPost, updatePost, deletePost, canManage } =
    usePosts();
  const { message, modal } = App.useApp();
  const {
    token: { margin },
  } = theme.useToken();

  const [modalState, setModalState] = React.useState<ModalState>(null);
  const [saving, setSaving] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Infinite scroll: load the next page when the sentinel nears the viewport.
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore, error, items.length]);

  const handleSubmit = async (values: PostInput) => {
    if (!modalState) return;
    setSaving(true);
    try {
      if (modalState.mode === "create") await createPost(values);
      else await updatePost(modalState.post.id, values);
      setModalState(null);
    } catch {
      message.error(modalState.mode === "create" ? "Failed to create post" : "Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (post: Post) => {
    modal.confirm({
      title: "Delete this post?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deletePost(post.id);
        } catch {
          message.error("Failed to delete post");
        }
      },
    });
  };

  const renderBody = () => {
    if (loading && items.length === 0) {
      return [0, 1, 2].map((i) => (
        <Card key={i}>
          <Skeleton avatar active paragraph={{ rows: 3 }} />
        </Card>
      ));
    }
    if (error && items.length === 0) {
      return (
        <Alert
          type="error"
          showIcon
          title="Couldn't load posts."
          action={<Button onClick={loadMore}>Retry</Button>}
        />
      );
    }
    if (items.length === 0) {
      return (
        <Empty description="No posts yet">
          <Button type="primary" onClick={() => setModalState({ mode: "create" })}>
            Create the first post
          </Button>
        </Empty>
      );
    }
    return (
      <>
        {items.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            canManage={canManage(post)}
            onEdit={(p) => setModalState({ mode: "edit", post: p })}
            onDelete={handleDelete}
          />
        ))}
        <div ref={sentinelRef} />
        {loading && (
          <Flex justify="center">
            <Spin />
          </Flex>
        )}
        {error && (
          <Alert
            type="error"
            showIcon
            title="Couldn't load more posts."
            action={<Button onClick={loadMore}>Retry</Button>}
          />
        )}
        {!hasMore && <Divider plain>You're all caught up</Divider>}
      </>
    );
  };

  return (
    <Row justify="center">
      <Col xs={24} md={20} lg={16} xl={12}>
        <Flex vertical gap={margin}>
          <Flex justify="space-between" align="center">
            <Typography.Title level={4} style={{ margin: 0 }}>
              Feed
            </Typography.Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalState({ mode: "create" })}>
              New Post
            </Button>
          </Flex>
          {renderBody()}
        </Flex>
      </Col>

      <PostFormModal
        open={!!modalState}
        mode={modalState?.mode ?? "create"}
        initialValues={
          modalState?.mode === "edit"
            ? { caption: modalState.post.caption ?? "", media_url: modalState.post.media_url ?? "" }
            : undefined
        }
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => setModalState(null)}
      />
    </Row>
  );
};

export default PostFeed;
