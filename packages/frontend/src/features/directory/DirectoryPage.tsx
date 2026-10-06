import type { AlumniListResponse } from '@alumni/shared';
import { useId, useRef } from 'react';
import { DIRECTORY_PAGE_SIZE } from './constants';
import { LoadError, NoResults } from './DirectoryStates';
import { FilterBar } from './FilterBar';
import { Pagination } from './Pagination';
import type { DirectoryParams } from './params';
import { ResultsGrid } from './ResultsGrid';
import { useAlumniSearch } from './useAlumniSearch';
import { useDirectoryParams } from './useDirectoryParams';
import styles from './DirectoryPage.module.css';

function hasSearchOrFilter({ q, department, university, graduationYear }: DirectoryParams) {
  return (
    q !== undefined ||
    department !== undefined ||
    university !== undefined ||
    graduationYear !== undefined
  );
}

function alumniWord(count: number): string {
  return count === 1 ? 'alumnus' : 'alumni';
}

interface CountProps {
  page: number;
  data: AlumniListResponse | undefined;
}

/**
 * "Showing a–b of N alumni" from 48rem, "N alumni" below (both in the DOM,
 * swapped by CSS, never the hidden attribute: G18). The live region is always
 * rendered so changes are announced; it is filled only for a loaded page that
 * has items (empty while loading, on error and past the end: ADV-005).
 */
function ResultCount({ page, data }: CountProps) {
  const shown = data !== undefined && data.items.length > 0;
  let content = null;
  if (shown) {
    const first = (page - 1) * DIRECTORY_PAGE_SIZE + 1;
    const last = first + data.items.length - 1;
    const word = alumniWord(data.total);
    content = (
      <>
        <span className={styles.countLong}>
          Showing {first}–{last} of {data.total} {word}
        </span>
        <span className={styles.countShort}>
          {data.total} {word}
        </span>
      </>
    );
  }
  return (
    <p className={styles.count} aria-live="polite">
      {content}
    </p>
  );
}

/**
 * The alumni directory (S2). The URL query string holds the search, filters
 * and page (ADR-08); this page reads it, fetches that page and shows one of
 * the states: loading, error, empty (filtered, none, past the end) or results.
 */
export function DirectoryPage() {
  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { params, setQuery, setFilters, setPage, clearAll } = useDirectoryParams();
  const { data, isPending, isError, isFetching, refetch } = useAlumniSearch(params);

  // The clicked page button is replaced by skeletons while the new page loads,
  // so focus moves to the heading instead of falling to <body> (UI-001).
  const goToPage = (page: number) => {
    setPage(page);
    titleRef.current?.focus({ preventScroll: true });
    sectionRef.current?.scrollIntoView({ block: 'start' });
  };

  let body;
  if (isPending) {
    body = <ResultsGrid loading skeletonCount={DIRECTORY_PAGE_SIZE} />;
  } else if (isError) {
    body = (
      <LoadError
        retrying={isFetching}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  } else if (data.items.length === 0) {
    if (data.total > 0 && params.page > 1) {
      body = (
        <NoResults
          variant="pastEnd"
          onFirstPage={() => {
            goToPage(1);
          }}
        />
      );
    } else if (hasSearchOrFilter(params)) {
      body = <NoResults variant="filtered" filters={params} onClearFilters={clearAll} />;
    } else {
      body = <NoResults variant="none" />;
    }
  } else {
    body = (
      <>
        <ResultsGrid items={data.items} />
        <Pagination
          page={params.page}
          totalPages={Math.ceil(data.total / DIRECTORY_PAGE_SIZE)}
          onPageChange={goToPage}
        />
      </>
    );
  }

  return (
    <section ref={sectionRef} className={styles.page} aria-labelledby={titleId}>
      <div className={styles.headingRow}>
        <h1 id={titleId} ref={titleRef} className={styles.title} tabIndex={-1}>
          Alumni Directory
        </h1>
        <ResultCount page={params.page} data={isError ? undefined : data} />
      </div>
      <FilterBar
        params={params}
        onQueryChange={setQuery}
        onFilterChange={setFilters}
        onClearAll={clearAll}
      />
      {body}
    </section>
  );
}
