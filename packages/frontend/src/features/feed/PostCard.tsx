import type { MyProfile } from '@alumni/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cx } from '@/components/ui/cx';
import { Menu, MenuItem } from '@/components/ui/Menu';
import { AuthorAvatar, AuthorName, Timestamp } from './Byline';
import type { FeedPost } from './cacheEdits';
import { CommentThread } from './CommentThread';
import { POST_MAX_LENGTH } from './constants';
import { EditBox } from './EditBox';
import { commentToggleLabel, deletePostQuestion } from './feedFormat';
import { canModify } from './permissions';
import { useUpdatePost } from './useFeedMutations';
import styles from './PostCard.module.css';

export interface PostCardProps {
  post: FeedPost;
  me: Pick<MyProfile, 'user_id' | 'role' | 'name' | 'photo_url'> | undefined;
  /** Asked to delete (from the menu). The page decides whether to confirm first. */
  onDelete: (post: FeedPost) => void;
  /** True while the page shows the inline "Delete this post and its N comments?". */
  confirmingDelete?: boolean;
  onConfirmDelete?: (post: FeedPost) => void;
  onCancelDelete?: () => void;
  /** The time "3 days ago" is measured from; defaults to now. */
  now?: Date;
}

function DotsIcon() {
  return (
    <svg
      className={styles.dots}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable={false}
    >
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

/**
 * One feed post (S4): author (linked to their profile when they have one),
 * time, text, the comment-count toggle and, when open, its thread. The "Post
 * actions" menu (Edit post, Delete post) shows only to the author or an admin
 * and never on a pending post (negative id), whose toggle is disabled too.
 * Edit is inline; Save or Cancel puts focus back on the menu button.
 */
export function PostCard({
  post,
  me,
  onDelete,
  confirmingDelete = false,
  onConfirmDelete,
  onCancelDelete,
  now,
}: PostCardProps) {
  const threadId = useId();
  const questionId = useId();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const update = useUpdatePost();
  const pending = post.id < 0;
  const mayModify = !pending && canModify(me, post.user_id);
  const count = post.comment_count ?? 0;

  function focusMenu() {
    requestAnimationFrame(() => {
      menuRef.current?.querySelector('button')?.focus();
    });
  }

  useEffect(() => {
    if (!confirmingDelete) return;
    // A frame later: the closing menu first returns focus to its trigger.
    const frame = requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [confirmingDelete]);

  return (
    <Card as="article" className={styles.card}>
      <div className={styles.header}>
        <AuthorAvatar
          name={post.author_name}
          photo={post.author_photo}
          alumniId={post.author_alumni_id}
          size="xs"
        />
        <div className={styles.byline}>
          <AuthorName
            name={post.author_name}
            alumniId={post.author_alumni_id}
            className={styles.name}
          />
          <p className={styles.time}>
            <Timestamp created={post.created_at} updated={post.updated_at} now={now} />
          </p>
        </div>
        {mayModify && (
          <div ref={menuRef} className={styles.menu}>
            <Menu
              trigger={<DotsIcon />}
              label="Post actions"
              align="end"
              className={styles.menuTrigger}
            >
              <MenuItem
                onSelect={() => {
                  setEditing(true);
                }}
              >
                Edit post
              </MenuItem>
              <MenuItem
                tone="danger"
                onSelect={() => {
                  onDelete(post);
                }}
              >
                Delete post
              </MenuItem>
            </Menu>
          </div>
        )}
      </div>

      {editing ? (
        <EditBox
          label="Edit post"
          initial={post.caption ?? ''}
          maxLength={POST_MAX_LENGTH}
          onSave={(caption) => {
            update.mutate({ id: post.id, caption });
            setEditing(false);
            focusMenu();
          }}
          onCancel={() => {
            setEditing(false);
            focusMenu();
          }}
        />
      ) : (
        post.caption !== undefined &&
        post.caption.trim() !== '' && <p className={styles.text}>{post.caption}</p>
      )}

      {update.errorMessage !== null && (
        <Alert tone="error" title="Your edit wasn't saved">
          {update.errorMessage}
        </Alert>
      )}

      {confirmingDelete && (
        <div className={styles.confirm} role="group" aria-labelledby={questionId}>
          <p id={questionId} className={styles.question}>
            {deletePostQuestion(count)}
          </p>
          <div className={styles.confirmActions}>
            <Button
              ref={cancelRef}
              className={styles.confirmButton}
              onClick={() => {
                onCancelDelete?.();
                focusMenu();
              }}
            >
              Cancel
            </Button>
            <Button
              className={cx(styles.confirmButton, styles.danger)}
              onClick={() => {
                onConfirmDelete?.(post);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={open ? threadId : undefined}
        disabled={pending}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        {commentToggleLabel(count, open)}
      </button>

      {open && !pending && <CommentThread id={threadId} postId={post.id} me={me} />}
    </Card>
  );
}
