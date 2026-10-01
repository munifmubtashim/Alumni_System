import React from "react";
import type { Comment } from "@alumni/shared";
import { App, Alert, Avatar, Button, Flex, Popconfirm, Skeleton, Typography, theme } from "antd";
import { useComments } from "../hooks/useComments";
import { initials } from "../utils/alumni";
import { formatRelative } from "../utils/time";
import CommentComposer from "./CommentComposer";

type CommentSectionProps = {
  postId: number;
  onCountChange: (count: number) => void;
};

type CommentItemProps = {
  comment: Comment;
  replyCount: number;
  canDelete: boolean;
  onReply: () => void;
  onDelete: () => void;
};

const CommentItem: React.FC<CommentItemProps> = ({ comment, replyCount, canDelete, onReply, onDelete }) => {
  const {
    token: { marginSM, marginXS, fontSizeSM, colorPrimary },
  } = theme.useToken();
  const deleteTitle =
    replyCount > 0
      ? `Delete this comment and its ${replyCount} ${replyCount === 1 ? "reply" : "replies"}?`
      : "Delete this comment?";

  return (
    <Flex gap={marginSM} align="flex-start" role="listitem">
      <Avatar size="small" src={comment.author_photo} style={{ backgroundColor: colorPrimary, flexShrink: 0 }}>
        {initials(comment.author_name)}
      </Avatar>
      <Flex vertical style={{ flex: 1, minWidth: 0 }}>
        <Flex gap={marginXS} align="baseline" wrap>
          <Typography.Text strong>{comment.author_name ?? `User #${comment.user_id}`}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: fontSizeSM }}>
            {formatRelative(comment.created_at)}
          </Typography.Text>
        </Flex>
        <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
          {comment.content}
        </Typography.Paragraph>
        <Flex gap={marginSM}>
          <Button type="link" size="small" onClick={onReply} style={{ paddingInline: 0 }}>
            Reply
          </Button>
          {canDelete && (
            <Popconfirm title={deleteTitle} okText="Delete" okButtonProps={{ danger: true }} onConfirm={onDelete}>
              <Button type="link" size="small" danger style={{ paddingInline: 0 }}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({ postId, onCountChange }) => {
  const { comments, loading, loaded, error, reload, add, remove, canDelete } = useComments(postId, true);
  const { message } = App.useApp();
  // Which thread has an open reply box, and who is being answered (for the "@Name" prefix).
  const [replyTo, setReplyTo] = React.useState<{ threadId: number; mention?: string } | null>(null);
  const {
    token: { margin, marginSM, controlHeightSM },
  } = theme.useToken();

  React.useEffect(() => {
    if (loaded) onCountChange(comments.length);
  }, [comments.length, loaded]);

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByThread = new Map<number, Comment[]>();
  for (const c of comments) {
    if (c.parent_id) repliesByThread.set(c.parent_id, [...(repliesByThread.get(c.parent_id) ?? []), c]);
  }

  const handleDelete = async (id: number) => {
    try {
      await remove(id);
      if (replyTo?.threadId === id) setReplyTo(null);
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  // Replies line up with the parent's text: avatar width + gap.
  const replyIndent = controlHeightSM + marginSM;

  return (
    <Flex vertical gap={margin}>
      {loading && !loaded ? (
        <Skeleton avatar={{ size: "small" }} active paragraph={{ rows: 1 }} />
      ) : error ? (
        <Alert
          type="error"
          showIcon
          title="Couldn't load comments."
          action={<Button size="small" onClick={reload}>Retry</Button>}
        />
      ) : topLevel.length === 0 ? (
        <Typography.Text type="secondary">No comments yet. Be the first!</Typography.Text>
      ) : (
        <Flex vertical gap={margin} role="list" aria-label="Comments">
          {topLevel.map((comment) => {
            const replies = repliesByThread.get(comment.id) ?? [];
            const replying = replyTo?.threadId === comment.id;
            return (
              <Flex key={comment.id} vertical gap={marginSM}>
                <CommentItem
                  comment={comment}
                  replyCount={replies.length}
                  canDelete={canDelete(comment)}
                  onReply={() => setReplyTo({ threadId: comment.id })}
                  onDelete={() => handleDelete(comment.id)}
                />
                {(replies.length > 0 || replying) && (
                  <Flex
                    vertical
                    gap={marginSM}
                    role="list"
                    aria-label={`Replies to ${comment.author_name ?? "comment"}`}
                    style={{ paddingInlineStart: replyIndent }}
                  >
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        replyCount={0}
                        canDelete={canDelete(reply)}
                        onReply={() => setReplyTo({ threadId: comment.id, mention: reply.author_name })}
                        onDelete={() => handleDelete(reply.id)}
                      />
                    ))}
                    {replying && (
                      <CommentComposer
                        key={`${comment.id}-${replyTo?.mention ?? ""}`}
                        autoFocus
                        initialValue={replyTo?.mention ? `@${replyTo.mention} ` : ""}
                        placeholder={`Reply to ${comment.author_name ?? "comment"}…`}
                        submitLabel="Reply"
                        onSubmit={async (content) => {
                          await add(content, comment.id);
                          setReplyTo(null);
                        }}
                        onCancel={() => setReplyTo(null)}
                      />
                    )}
                  </Flex>
                )}
              </Flex>
            );
          })}
        </Flex>
      )}

      <CommentComposer onSubmit={(content) => add(content)} />
    </Flex>
  );
};

export default CommentSection;
