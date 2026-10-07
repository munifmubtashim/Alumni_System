import type { MyProfile } from '@alumni/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { isNotFoundError } from '@/services/httpErrors';
import { AuthorAvatar, AuthorName, Timestamp, UNKNOWN_AUTHOR } from './Byline';
import type { FeedComment } from './cacheEdits';
import { COMMENT_MAX_LENGTH, POSTS_QUERY_KEY } from './constants';
import { EditBox } from './EditBox';
import { firstName, groupThread, itemKey } from './feedFormat';
import { canModify } from './permissions';
import { useComments } from './useComments';
import { useCreateComment, useDeleteComment, useUpdateComment } from './useFeedMutations';
import styles from './CommentThread.module.css';

/** Shown in place of the thread when the post was deleted meanwhile (a 404). */
export const POST_GONE_MESSAGE = 'This post is no longer available';

const SKELETON_COUNT = 2;

type Me = Pick<MyProfile, 'user_id' | 'role' | 'name' | 'photo_url'>;

/** Who a new comment answers: the top-level comment it goes under and the name shown. */
interface ReplyTarget {
  parentId: number;
  name: string;
}

interface CommentRowProps {
  comment: FeedComment;
  /** The top-level comment a reply to this row goes under (threads are one level deep). */
  threadParentId: number;
  me: Me | undefined;
  onReply: (target: ReplyTarget) => void;
  onSave: (id: number, content: string) => void;
  onDelete: (id: number) => void;
}

/**
 * One comment: avatar, bold name and text, then "<time> · Reply · Edit · Delete".
 * Edit and Delete only for the author or an admin; a pending comment (negative
 * id) has no actions. Edit opens an inline box; Save or Cancel puts focus back
 * on the Edit button.
 */
function CommentRow({ comment, threadParentId, me, onReply, onSave, onDelete }: CommentRowProps) {
  const [editing, setEditing] = useState(false);
  const editRef = useRef<HTMLButtonElement>(null);
  const pending = comment.id < 0;
  const mayModify = !pending && canModify(me, comment.user_id);
  const name = comment.author_name ?? UNKNOWN_AUTHOR;

  function closeEdit() {
    setEditing(false);
    requestAnimationFrame(() => {
      editRef.current?.focus();
    });
  }

  return (
    <div className={styles.comment}>
      <AuthorAvatar
        name={comment.author_name}
        photo={comment.author_photo}
        alumniId={comment.author_alumni_id}
        size="xs"
        className={styles.avatar}
      />
      <div className={styles.body}>
        {editing ? (
          <EditBox
            label="Edit comment"
            initial={comment.content}
            maxLength={COMMENT_MAX_LENGTH}
            size="compact"
            onSave={(content) => {
              onSave(comment.id, content);
              closeEdit();
            }}
            onCancel={closeEdit}
          />
        ) : (
          <p className={styles.text}>
            <AuthorName
              name={comment.author_name}
              alumniId={comment.author_alumni_id}
              className={styles.name}
            />{' '}
            {comment.content}
          </p>
        )}
        <p className={styles.meta}>
          <Timestamp created={comment.created_at} updated={comment.updated_at} />
          {!pending && (
            <>
              {' · '}
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  onReply({ parentId: threadParentId, name });
                }}
              >
                Reply <VisuallyHidden>to {name}</VisuallyHidden>
              </button>
            </>
          )}
          {mayModify && !editing && (
            <>
              {' · '}
              <button
                ref={editRef}
                type="button"
                className={styles.action}
                onClick={() => {
                  setEditing(true);
                }}
              >
                Edit <VisuallyHidden>comment by {name}</VisuallyHidden>
              </button>
              {' · '}
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  onDelete(comment.id);
                }}
              >
                Delete <VisuallyHidden>comment by {name}</VisuallyHidden>
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export interface CommentThreadProps {
  postId: number;
  /** The signed-in user: the reply box avatar and who may edit or delete. */
  me: Me | undefined;
  /** The thread element's id, for the toggle's aria-controls. */
  id?: string;
}

/**
 * A post's comments, oldest first, replies indented under their comment, and
 * a reply box (a pill input with the user's avatar). Loads when it mounts (the
 * card mounts it only while open). New comments show at once and put the text
 * back on failure; deletes are immediate. A 404 means the post is gone: say so
 * and refetch the feed. Write state lives here, not in the rows, because a
 * deleted row unmounts before its rollback.
 */
export function CommentThread({ postId, me, id }: CommentThreadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const client = useQueryClient();
  const comments = useComments(postId, true);
  const create = useCreateComment(postId);
  const update = useUpdateComment(postId);
  const remove = useDeleteComment(postId);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const gone = comments.isError && isNotFoundError(comments.error);

  useEffect(() => {
    if (gone) void client.invalidateQueries({ queryKey: POSTS_QUERY_KEY, exact: true });
  }, [gone, client]);

  if (gone) {
    return (
      <div id={id} className={styles.thread}>
        <p className={styles.notice}>{POST_GONE_MESSAGE}</p>
      </div>
    );
  }

  const list = comments.data ?? [];
  const entries = groupThread(list);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = text.trim();
    if (content === '') return;
    const target = replyTo;
    create.mutate(target === null ? { content } : { content, parent_id: target.parentId }, {
      onError: () => {
        setText((current) => (current === '' ? content : current));
        setReplyTo((current) => current ?? target);
      },
    });
    setText('');
    setReplyTo(null);
  }

  function rowProps(comment: FeedComment, threadParentId: number) {
    return {
      comment,
      threadParentId,
      me,
      onReply: (target: ReplyTarget) => {
        setReplyTo(target);
        inputRef.current?.focus();
      },
      onSave: (commentId: number, content: string) => {
        update.mutate({ id: commentId, content });
      },
      onDelete: (commentId: number) => {
        remove.mutate({ id: commentId });
        inputRef.current?.focus();
      },
    };
  }

  const replyFirst = replyTo === null ? undefined : (firstName(replyTo.name) ?? replyTo.name);
  const placeholder =
    replyFirst !== undefined
      ? `Reply to ${replyFirst}…`
      : list.length === 0
        ? 'Write a comment…'
        : 'Write a reply…';
  const errorMessage = create.errorMessage ?? update.errorMessage ?? remove.errorMessage;
  const errorTitle =
    create.errorMessage !== null
      ? "Your comment wasn't posted"
      : update.errorMessage !== null
        ? "Your edit wasn't saved"
        : "The comment wasn't deleted";

  return (
    <div id={id} className={styles.thread}>
      {comments.isPending && (
        <>
          <VisuallyHidden as="p" role="status">
            Loading comments…
          </VisuallyHidden>
          <div className={styles.list} aria-busy="true">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <div key={index} className={styles.comment} aria-hidden="true">
                <Skeleton shape="circle" className={styles.skeletonAvatar} />
                <Skeleton className={styles.skeletonLine} />
              </div>
            ))}
          </div>
        </>
      )}
      {comments.isError && comments.data === undefined && (
        <div className={styles.loadError}>
          <Alert tone="error" title="Comments didn't load">
            Something went wrong on our side or with the connection. Try again in a moment.
          </Alert>
          <Button
            className={styles.retry}
            loading={comments.isFetching}
            onClick={() => {
              void comments.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      )}
      {entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map(({ comment, replies }) => (
            <li key={itemKey(comment)} className={styles.entry}>
              <CommentRow {...rowProps(comment, comment.id)} />
              {replies.length > 0 && (
                <ul className={styles.replies}>
                  {replies.map((reply) => (
                    <li key={itemKey(reply)}>
                      <CommentRow {...rowProps(reply, comment.id)} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {errorMessage !== null && (
        <Alert tone="error" title={errorTitle}>
          {errorMessage}
        </Alert>
      )}
      {!(comments.isError && comments.data === undefined) && (
        <form className={styles.replyBox} onSubmit={submit}>
          <Avatar
            name={me?.name ?? ''}
            photoUrl={me?.photo_url}
            size="xs"
            className={styles.avatar}
          />
          <VisuallyHidden as="label" htmlFor={inputId}>
            {replyTo === null ? 'Write a comment' : `Reply to ${replyTo.name}`}
          </VisuallyHidden>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            className={styles.input}
            value={text}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder={placeholder}
            autoComplete="off"
            onChange={(event) => {
              setText(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && replyTo !== null) {
                event.preventDefault();
                setReplyTo(null);
              }
            }}
          />
          {replyTo !== null && (
            <Button
              variant="ghost"
              className={styles.send}
              onClick={() => {
                setReplyTo(null);
                inputRef.current?.focus();
              }}
            >
              Cancel <VisuallyHidden>reply</VisuallyHidden>
            </Button>
          )}
          {text.trim() !== '' && (
            <Button type="submit" variant="ghost" className={styles.send}>
              Send
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
