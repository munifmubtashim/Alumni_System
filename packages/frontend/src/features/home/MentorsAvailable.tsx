import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { DIRECTORY_PATH } from '@/config/directoryReturn';
import { ALUMNI_QUERY_ROOT } from '@/config/queryKeys';
import {
  PersonList,
  PersonListSkeleton,
  SectionCard,
  SectionEmpty,
  SectionError,
  SectionLoadingStatus,
} from '@/features/people';
import { searchAlumni } from '@/services/alumniApi';

/** How many mentors Home shows. */
export const MENTORS_SHOWN = 4;
/** One more than shown, so dropping the signed-in user still leaves 4 when 4 others exist. */
const MENTORS_FETCHED = MENTORS_SHOWN + 1;
/** Under the alumni root, so an admin write's invalidation of `['alumni']` refreshes it. */
const MENTORS_KEY = [ALUMNI_QUERY_ROOT, 'mentors'] as const;
const SKELETON_COUNT = 3;

function useMentors() {
  return useQuery({
    queryKey: MENTORS_KEY,
    queryFn: () => searchAlumni({ mentorship: true, page: 1, pageSize: MENTORS_FETCHED }),
  });
}

export interface MentorsAvailableProps {
  /** The signed-in user's own alumni id, left out of the list; null without an alumni profile. */
  ownAlumniId: number | null;
}

/**
 * "Mentors available": up to 4 alumni with mentorship on, from
 * `GET /api/alumni?mentorship=true`, as `PersonRow`s (each has the Mentor
 * tag), never the signed-in user, with "Browse directory" to `/directory`.
 * Owns its loading, empty and error states, so a failure never hides the rest
 * of Home.
 */
export function MentorsAvailable({ ownAlumniId }: MentorsAvailableProps) {
  const mentors = useMentors();

  let body: ReactNode;
  if (mentors.isPending) {
    body = (
      <>
        <SectionLoadingStatus>Loading mentors…</SectionLoadingStatus>
        <PersonListSkeleton count={SKELETON_COUNT} />
      </>
    );
  } else if (mentors.isError && mentors.data === undefined) {
    body = (
      <SectionError
        title="Mentors didn't load"
        retrying={mentors.isFetching}
        onRetry={() => {
          void mentors.refetch();
        }}
      />
    );
  } else {
    const people = mentors.data.items
      .filter((person) => person.id !== ownAlumniId)
      .slice(0, MENTORS_SHOWN);
    body =
      people.length === 0 ? (
        <SectionEmpty>No mentors available yet. Check back soon.</SectionEmpty>
      ) : (
        <PersonList people={people} />
      );
  }

  return (
    <SectionCard
      title="Mentors available"
      action={{ to: DIRECTORY_PATH, label: 'Browse directory' }}
    >
      {body}
    </SectionCard>
  );
}
