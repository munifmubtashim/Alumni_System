import type { MyProfile } from '@alumni/shared';
import { useId, useRef, useState, type SubmitEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { POST_MAX_LENGTH } from './constants';
import { composerPlaceholder, postRemaining } from './feedFormat';
import { useWideScreen } from './useWideScreen';
import { useCreatePost } from './useFeedMutations';
import styles from './Composer.module.css';

export interface ComposerProps {
  /** The signed-in user (avatar and the placeholder's first name). */
  me: Pick<MyProfile, 'name' | 'photo_url'> | undefined;
}

/**
 * New post box at the top of the feed. The post shows at once (optimistic) and
 * the field clears, keeping focus; if the API refuses, the post is taken back,
 * the text returns to an empty field and the error shows under it. Post is
 * disabled while the text is blank; the text is capped at POST_MAX_LENGTH and
 * the characters left show only near the cap.
 */
export function Composer({ me }: ComposerProps) {
  const wide = useWideScreen();
  const fieldId = useId();
  const countId = useId();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const create = useCreatePost();
  const blank = text.trim() === '';
  const remaining = postRemaining(text);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blank) return;
    const caption = text;
    create.mutate(
      { caption },
      {
        onError: () => {
          setText((current) => (current === '' ? caption : current));
        },
      },
    );
    setText('');
    fieldRef.current?.focus();
  }

  return (
    <Card className={styles.card}>
      <Avatar name={me?.name ?? ''} photoUrl={me?.photo_url} size="xs" className={styles.avatar} />
      <form className={styles.form} onSubmit={submit}>
        <VisuallyHidden as="label" htmlFor={fieldId}>
          Write a post
        </VisuallyHidden>
        <textarea
          ref={fieldRef}
          id={fieldId}
          className={styles.field}
          rows={2}
          value={text}
          maxLength={POST_MAX_LENGTH}
          placeholder={composerPlaceholder(wide ? me?.name : undefined)}
          aria-describedby={remaining.show ? countId : undefined}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        {create.errorMessage !== null && (
          <Alert tone="error" title="Your post wasn't shared">
            {create.errorMessage}
          </Alert>
        )}
        <div className={styles.actions}>
          {remaining.show && (
            <p id={countId} className={styles.count}>
              {remaining.left === 1
                ? '1 character left'
                : `${String(remaining.left)} characters left`}
            </p>
          )}
          <Button type="submit" variant="primary" className={styles.post} disabled={blank}>
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
