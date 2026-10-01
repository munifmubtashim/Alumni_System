import React from "react";
import { App, Button, Flex, Input, theme } from "antd";
import type { GetRef } from "antd";

type CommentComposerProps = {
  // Rejects with an Error whose message is shown to the user.
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  autoFocus?: boolean;
  onCancel?: () => void;
};

const MAX_LENGTH = 2000;

const CommentComposer: React.FC<CommentComposerProps> = ({
  onSubmit,
  placeholder = "Write a comment…",
  submitLabel = "Comment",
  initialValue = "",
  autoFocus = false,
  onCancel,
}) => {
  const [draft, setDraft] = React.useState(initialValue);
  const [sending, setSending] = React.useState(false);
  const inputRef = React.useRef<GetRef<typeof Input.TextArea>>(null);
  const { message } = App.useApp();
  const {
    token: { marginXS },
  } = theme.useToken();

  React.useEffect(() => {
    // Put the caret after any pre-filled "@Name ".
    if (autoFocus) inputRef.current?.focus({ cursor: "end" });
  }, []);

  const submit = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await onSubmit(content);
      setDraft("");
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Flex gap={marginXS} align="flex-end">
      <Input.TextArea
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape" && onCancel) onCancel();
        }}
        autoSize={{ minRows: 1, maxRows: 6 }}
        maxLength={MAX_LENGTH}
        placeholder={`${placeholder} (Ctrl/⌘ + Enter to send)`}
        aria-label={placeholder}
      />
      {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      <Button type="primary" onClick={submit} loading={sending} disabled={!draft.trim()}>
        {submitLabel}
      </Button>
    </Flex>
  );
};

export default CommentComposer;
