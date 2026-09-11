import React from "react";
import {
  Flex,
  Listy,
  Spin,
  Typography,
  Empty,
  Card,
  Button,
} from "antd";
import { UserOutlined, CommentOutlined } from "@ant-design/icons";
import axios from "axios";
import type { Post } from "@alumni/shared";
import { useAtom } from 'jotai';
import { postsAtom, postsLoadingAtom, postsHasMoreAtom } from '../store/postsAtom';


const PAGE_SIZE = 50;

const PostFeed: React.FC = () => {
   const [items, setItems] = useAtom(postsAtom);
  const [loading, setLoading] = useAtom(postsLoadingAtom);
  const [hasMore, setHasMore] = useAtom(postsHasMoreAtom);
  // rest stays the same (loadPage, useEffect, onScroll, render)
  const loadingRef = React.useRef(false);

  const loadPage = (offset: number) => {
    loadingRef.current = true;
    setLoading(true);
    axios
      .get(`http://localhost:3000/api/posts?limit=${PAGE_SIZE}&offset=${offset}`)
     .then((res) => {
  const newPosts: Post[] = res.data;
  setItems((prev) => {
    const existingIds = new Set(prev.map((p) => p.id));
    const deduped = newPosts.filter((p) => !existingIds.has(p.id));
    return [...prev, ...deduped];
  });
  if (newPosts.length < PAGE_SIZE) setHasMore(false);
})
  };

  React.useEffect(() => {
    loadPage(0);
  }, []);

  const onScroll: React.UIEventHandler<HTMLElement> = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (
      scrollHeight - scrollTop - clientHeight > 200 ||
      loadingRef.current ||
      !hasMore
    )
      return;

    loadPage(items.length);
  };

  if (loading && items.length === 0) {
    return (
      <Flex justify="center" style={{ height: 200 }}>
        <Spin size="large" />
      </Flex>
    );
  }
  if (items.length === 0) return <Empty description="No posts yet" />;

  return (
    <Flex
      vertical
      gap="small"
      style={{ maxWidth: 600, margin: "0 auto", minHeight: "100%" }}
    >
      <Listy<Post>
        virtual
        items={items}
        rowKey="id"
        height={600}
        onScroll={onScroll}
        itemRender={(post) => (
          <Card style={{ marginBottom: 16 }}>
            <Flex align="center" gap="small" style={{ marginBottom: 12 }}>
              <Typography.Text strong>
                {post.author_name ?? `User #${post.user_id}`}
              </Typography.Text>
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
        )}
      />
    </Flex>
  );
};

export default PostFeed;