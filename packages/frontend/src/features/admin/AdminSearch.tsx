import { useState, type ChangeEvent, type Ref } from 'react';
import { SearchField } from '@/components/ui/SearchField';
import { parseAdminParams, Q_MAX_LENGTH, stripControlCharacters, toSearchParams } from './params';
import { useDebouncedCallback } from './useDebouncedCallback';

/** How long typing must pause before the search text reaches the URL. */
export const SEARCH_DEBOUNCE_MS = 300;

export interface AdminSearchProps {
  /** The URL's search text (`useAdminParams().params.q`). */
  q: string | undefined;
  /** Writes the typed text to the URL (replaces the history entry, page 1). */
  onQueryChange: (q: string) => void;
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * What the box last saw of the URL: its `q`, the `q` our pending write sent
 * (until the URL shows it) and how many times `q` changed from outside.
 */
interface SyncState {
  q: string;
  sent: string | null;
  outsideChanges: number;
}

/**
 * The "Search alumni" box. Typing is debounced 300 ms and replaces the URL
 * entry. The same own-write guard as the directory's FilterBar
 * (L-REQ-006-1): a pending write is dropped if `q` changed from outside
 * after that keystroke (Back, Clear search), and the URL change our own write
 * causes never overwrites keys typed while it landed.
 */
export function AdminSearch({ q, onQueryChange, inputRef }: AdminSearchProps) {
  const urlQ = q ?? '';
  const [text, setText] = useState(urlQ);
  const [sync, setSync] = useState<SyncState>({ q: urlQ, sent: null, outsideChanges: 0 });
  if (urlQ !== sync.q) {
    const own = urlQ === sync.sent;
    setSync({
      q: urlQ,
      sent: null,
      outsideChanges: own ? sync.outsideChanges : sync.outsideChanges + 1,
    });
    if (!own && text.trim() !== urlQ) setText(urlQ);
  }

  const writeQuery = useDebouncedCallback((next: string, outsideChangesWhenTyped: number) => {
    if (sync.outsideChanges !== outsideChangesWhenTyped) return;
    // Set in the same tick as the navigation, so it is in place when the URL change renders.
    const sent =
      parseAdminParams(toSearchParams({ q: next, sort: 'name', order: 'asc', page: 1 })).q ?? '';
    setSync((current) => ({ ...current, sent }));
    onQueryChange(next);
  }, SEARCH_DEBOUNCE_MS);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = stripControlCharacters(event.target.value);
    setText(next);
    writeQuery.run(next, sync.outsideChanges);
  }

  return (
    <SearchField
      ref={inputRef}
      label="Search alumni"
      placeholder="Search alumni"
      value={text}
      onChange={handleChange}
      maxLength={Q_MAX_LENGTH}
      autoComplete="off"
    />
  );
}
