import React from "react";
import { Alert, Button, Card, Empty, Flex, Skeleton, theme } from "antd";
import type { Post } from "@alumni/shared";
import PostCard from "./PostCard";

type UserPostListProps = {
  posts: Post[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  emptyText?: string;
};

// Read-only list of one user's posts (profile pages).
const UserPostList: React.FC<UserPostListProps> = ({ posts, loading, error, onRetry, emptyText = "No posts yet" }) => {
  const {
    token: { margin },
  } = theme.useToken();

  if (loading) {
    return (
      <Card>
        <Skeleton avatar active paragraph={{ rows: 3 }} />
      </Card>
    );
  }
  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        title="Couldn't load posts."
        action={<Button onClick={onRetry}>Retry</Button>}
      />
    );
  }
  if (posts.length === 0) {
    return (
      <Card>
        <Empty description={emptyText} />
      </Card>
    );
  }
  return (
    <Flex vertical gap={margin}>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </Flex>
  );
};

export default UserPostList;
