import React from "react";
import { CommentOutlined, MoreOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Divider, Dropdown, Flex, Image, Typography, theme } from "antd";
import type { Post } from "@alumni/shared";
import { formatRelative } from "../utils/time";
import CommentSection from "./CommentSection";

type PostCardProps = {
  post: Post;
  canManage?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
};


const PostCard: React.FC<PostCardProps> = ({ post, canManage = false, onEdit, onDelete }) => {
  const {
    token: { marginSM, fontSizeSM, borderRadius },
  } = theme.useToken();

  const authorName = post.author_name ?? `User #${post.user_id}`;
  const postedAt = formatRelative(post.created_at);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [commentCount, setCommentCount] = React.useState(post.comment_count ?? 0);
  React.useEffect(() => setCommentCount(post.comment_count ?? 0), [post.comment_count]);

  return (
    <Card>
      <Flex justify="space-between" align="center" gap={marginSM} style={{ marginBottom: marginSM }}>
        <Flex align="center" gap={marginSM} style={{ minWidth: 0 }}>
          <Avatar src={post.author_photo} icon={!post.author_photo && <UserOutlined />} />
          <Flex vertical style={{ minWidth: 0 }}>
            <Typography.Text strong ellipsis>
              {authorName}
            </Typography.Text>
            {postedAt && (
              <Typography.Text
                type="secondary"
                style={{ fontSize: fontSizeSM }}
                title={new Date(post.created_at!).toLocaleString()}
              >
                {postedAt}
              </Typography.Text>
            )}
          </Flex>
        </Flex>
        {canManage && onEdit && onDelete && (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "edit", label: "Edit" },
                { key: "delete", label: "Delete", danger: true },
              ],
              onClick: ({ key }) => (key === "edit" ? onEdit(post) : onDelete(post)),
            }}
          >
            <Button type="text" icon={<MoreOutlined />} aria-label="Post actions" />
          </Dropdown>
        )}
      </Flex>

      {post.caption && (
        <Typography.Paragraph
          ellipsis={{ rows: 4, expandable: true, symbol: "more" }}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {post.caption}
        </Typography.Paragraph>
      )}

      {post.media_url && (
        <Image
          src={post.media_url}
          alt=""
          width="100%"
          style={{ borderRadius, marginBottom: marginSM }}
        />
      )}

      <Button
        type="text"
        size="small"
        icon={<CommentOutlined />}
        onClick={() => setCommentsOpen((open) => !open)}
        aria-expanded={commentsOpen}
        style={{ paddingInline: 0 }}
      >
        {commentCount} {commentCount === 1 ? "comment" : "comments"}
      </Button>

      {commentsOpen && (
        <>
          <Divider style={{ marginBlock: marginSM }} />
          <CommentSection postId={post.id} onCountChange={setCommentCount} />
        </>
      )}
    </Card>
  );
};

export default PostCard;
