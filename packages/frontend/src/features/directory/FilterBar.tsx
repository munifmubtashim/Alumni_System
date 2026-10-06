import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';
import { Chip } from '@/components/ui/Chip';
import { SearchField } from '@/components/ui/SearchField';
import { FilterPopover } from './FilterPopover';
import {
  DEPARTMENT_MAX_LENGTH,
  GRADUATION_YEARS_AHEAD,
  isValidGraduationYear,
  MIN_GRADUATION_YEAR,
  parseDirectoryParams,
  Q_MAX_LENGTH,
  stripControlCharacters,
  toSearchParams,
  UNIVERSITY_MAX_LENGTH,
  type DirectoryParams,
} from './params';
import { useDebouncedCallback } from './useDebouncedCallback';
import type { DirectoryFiltersPatch } from './useDirectoryParams';
import styles from './FilterBar.module.css';

/** How long typing must pause before the search text reaches the URL. */
export const SEARCH_DEBOUNCE_MS = 300;

export interface FilterBarProps {
  /** The parsed URL state (`useDirectoryParams().params`). */
  params: DirectoryParams;
  /** Writes the typed search text (replaces the history entry). */
  onQueryChange: (q: string) => void;
  /** Sets or clears filters, and optionally `q` (a new history entry). */
  onFilterChange: (patch: DirectoryFiltersPatch) => void;
  /** Drops the search text and every filter. */
  onClearAll: () => void;
}

type FilterKey = 'university' | 'department' | 'graduationYear';

const TEXT_HELPER = "The exact name; capitals don't matter.";

/** Text filters accept what the URL parser keeps, so an applied filter always becomes a chip. */
function textError(key: 'university' | 'department', name: string) {
  return (value: string): string | undefined => {
    if (value === '') return `Enter a ${name} name.`;
    const kept = parseDirectoryParams(new URLSearchParams({ [key]: value }))[key];
    return kept === undefined ? 'Remove tabs and other special characters.' : undefined;
  };
}

function yearError(value: string): string | undefined {
  if (isValidGraduationYear(value)) return undefined;
  const latest = new Date().getFullYear() + GRADUATION_YEARS_AHEAD;
  return `Enter a 4-digit year from ${String(MIN_GRADUATION_YEAR)} to ${String(latest)}.`;
}

interface FilterSpec {
  key: FilterKey;
  /** Pill and chip text. */
  label: string;
  fieldLabel: string;
  helperText?: string;
  maxLength: number;
  inputMode?: 'numeric';
  validate: (value: string) => string | undefined;
  toPatch: (value: string) => DirectoryFiltersPatch;
}

// Display order of chips and pills. "Field" from the design is left out (no API filter).
const FILTERS: readonly FilterSpec[] = [
  {
    key: 'university',
    label: 'University',
    fieldLabel: 'University',
    helperText: TEXT_HELPER,
    maxLength: UNIVERSITY_MAX_LENGTH,
    validate: textError('university', 'university'),
    toPatch: (value) => ({ university: value }),
  },
  {
    key: 'department',
    label: 'Department',
    fieldLabel: 'Department',
    helperText: TEXT_HELPER,
    maxLength: DEPARTMENT_MAX_LENGTH,
    validate: textError('department', 'department'),
    toPatch: (value) => ({ department: value }),
  },
  {
    key: 'graduationYear',
    label: 'Grad. year',
    fieldLabel: 'Graduation year',
    maxLength: 4,
    inputMode: 'numeric',
    validate: yearError,
    toPatch: (value) => ({ graduationYear: Number(value) }),
  },
];

/**
 * What the box last saw of the URL: its `q`, the `q` our pending write sent
 * (until the URL shows it) and how many times `q` changed from outside.
 */
interface SyncState {
  q: string;
  sent: string | null;
  outsideChanges: number;
}

/** Where focus goes once the URL change has rendered (ADV-002). */
type PendingFocus = { to: 'chip' | 'pill'; key: FilterKey } | { to: 'search' };

/**
 * Search box, a chip per active filter, a pill (popover) per inactive one and
 * "Clear all". The page owns the URL state; this component only reads `params`
 * and calls back.
 *
 * Typing is debounced: the URL write is scheduled from the change handler and
 * runs only if no outside change of `q` came after that keystroke, so Back,
 * Clear all or Apply during the wait are never undone by a stale write
 * (ADV-001). When `q` changes from outside, the box shows the new value. Our
 * own write is recognised by its value, so a key typed while it lands is kept,
 * and so is that key's own pending write (CORR-001).
 */
export function FilterBar({ params, onQueryChange, onFilterChange, onClearAll }: FilterBarProps) {
  const urlQ = params.q ?? '';
  const [text, setText] = useState(urlQ);
  const [sync, setSync] = useState<SyncState>({ q: urlQ, sent: null, outsideChanges: 0 });
  // The URL moved. Our own write (it carries the `q` we sent) leaves the box
  // alone, as it may already hold newer keys; an outside change shows its `q`.
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
    const sent = parseDirectoryParams(toSearchParams({ q: next, page: 1 })).q ?? '';
    setSync((current) => ({ ...current, sent }));
    onQueryChange(next);
  }, SEARCH_DEBOUNCE_MS);

  const searchRef = useRef<HTMLInputElement>(null);
  // One ref per element (G10): the pill triggers and the chips' remove buttons.
  const universityPill = useRef<HTMLButtonElement>(null);
  const departmentPill = useRef<HTMLButtonElement>(null);
  const yearPill = useRef<HTMLButtonElement>(null);
  const universityChip = useRef<HTMLButtonElement>(null);
  const departmentChip = useRef<HTMLButtonElement>(null);
  const yearChip = useRef<HTMLButtonElement>(null);
  const pillRefs: Record<FilterKey, RefObject<HTMLButtonElement | null>> = {
    university: universityPill,
    department: departmentPill,
    graduationYear: yearPill,
  };
  const chipRefs: Record<FilterKey, RefObject<HTMLButtonElement | null>> = {
    university: universityChip,
    department: departmentChip,
    graduationYear: yearChip,
  };

  // The pill and the chip swap places only after the URL change renders, so
  // focus is moved here, once the target exists.
  const pendingFocus = useRef<PendingFocus | null>(null);
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    const element =
      target.to === 'search'
        ? searchRef.current
        : target.to === 'chip'
          ? chipRefs[target.key].current
          : pillRefs[target.key].current;
    if (element) {
      pendingFocus.current = null;
      element.focus();
    }
  });

  function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
    // A pasted tab or line break becomes a space, so the box and the URL agree (CORR-002).
    const next = stripControlCharacters(event.target.value);
    setText(next);
    writeQuery.run(next, sync.outsideChanges);
  }

  /** A filter change also carries the box text, so a pending search write is not lost. */
  function changeFilters(patch: DirectoryFiltersPatch) {
    writeQuery.cancel();
    onFilterChange({ ...patch, q: text });
  }

  function handleClearAll() {
    writeQuery.cancel();
    setText('');
    pendingFocus.current = { to: 'search' };
    onClearAll();
  }

  const active = FILTERS.filter((filter) => params[filter.key] !== undefined);
  const inactive = FILTERS.filter((filter) => params[filter.key] === undefined);
  const anythingActive = active.length > 0 || params.q !== undefined;

  return (
    <div className={styles.bar}>
      <div className={styles.search}>
        <SearchField
          ref={searchRef}
          label="Search alumni"
          placeholder="Search by name, company or role"
          value={text}
          onChange={handleTextChange}
          maxLength={Q_MAX_LENGTH}
          autoComplete="off"
        />
      </div>
      <div className={styles.filters} role="group" aria-label="Filters">
        {active.map((filter) => {
          const name = `${filter.label}: ${String(params[filter.key])}`;
          return (
            <Chip
              key={filter.key}
              removeLabel={`Remove ${name}`}
              removeButtonRef={chipRefs[filter.key]}
              onRemove={() => {
                pendingFocus.current = { to: 'pill', key: filter.key };
                changeFilters({ [filter.key]: undefined });
              }}
            >
              {name}
            </Chip>
          );
        })}
        {inactive.map((filter) => (
          <FilterPopover
            key={filter.key}
            label={filter.label}
            fieldLabel={filter.fieldLabel}
            helperText={filter.helperText}
            maxLength={filter.maxLength}
            inputMode={filter.inputMode}
            validate={filter.validate}
            triggerRef={pillRefs[filter.key]}
            onApply={(value) => {
              pendingFocus.current = { to: 'chip', key: filter.key };
              changeFilters(filter.toPatch(value));
            }}
          />
        ))}
        {anythingActive && (
          <button type="button" className={styles.clearAll} onClick={handleClearAll}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
