import type { ReactNode } from 'react';
import { PersonList, PersonListSkeleton } from './PersonList';
import {
  SectionCard,
  SectionEmpty,
  SectionError,
  SectionLoadingStatus,
  type SectionHeadingLevel,
} from './SectionCard';
import { useSuggestedAlumni } from './useSuggestedAlumni';

const SKELETON_COUNT = 3;

export interface SuggestedAlumniProps {
  /** The title's heading level, so it fits the parent page's outline. Default 2. */
  headingLevel?: SectionHeadingLevel;
  /** Placement from the parent (grid area, margins). */
  className?: string;
}

/**
 * "Suggested alumni": a `SectionCard` listing the people
 * `GET /api/alumni/suggestions` returns, each a `PersonRow`. Used by Home and
 * the Feed sidebar (REQ-016). It owns its states, so its failure never reaches
 * the parent: skeleton rows while loading, an inline message with Retry on
 * error, a short note when there is nobody to suggest. A failed background
 * refetch keeps the people already shown.
 */
export function SuggestedAlumni({ headingLevel = 2, className }: SuggestedAlumniProps) {
  const suggestions = useSuggestedAlumni();

  let body: ReactNode;
  if (suggestions.isPending) {
    body = (
      <>
        <SectionLoadingStatus>Loading suggestions…</SectionLoadingStatus>
        <PersonListSkeleton count={SKELETON_COUNT} />
      </>
    );
  } else if (suggestions.isError && suggestions.data === undefined) {
    body = (
      <SectionError
        title="Suggestions didn't load"
        retrying={suggestions.isFetching}
        onRetry={() => {
          void suggestions.refetch();
        }}
      />
    );
  } else if (suggestions.data.length === 0) {
    body = <SectionEmpty>No suggestions yet. Check back as more alumni join.</SectionEmpty>;
  } else {
    body = <PersonList people={suggestions.data} />;
  }

  return (
    <SectionCard title="Suggested alumni" headingLevel={headingLevel} className={className}>
      {body}
    </SectionCard>
  );
}
