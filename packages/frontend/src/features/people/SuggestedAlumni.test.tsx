import type { AlumniListItem } from '@alumni/shared';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  fail,
  mockApi,
  never,
  ok,
  renderWithProviders,
  requests,
  resetApi,
  type Responder,
} from '@/test/fakeApi';
import { SuggestedAlumni, type SuggestedAlumniProps } from './SuggestedAlumni';

const SUGGESTIONS_URL = '/alumni/suggestions';

/** Each GET /alumni/suggestions takes the next responder; the last one repeats. */
function mockSuggestions(...responders: Responder[]): void {
  mockApi({ [SUGGESTIONS_URL]: responders });
}

const people: AlumniListItem[] = [
  {
    id: 3,
    user_id: 30,
    name: 'Ada Lovelace',
    job_title: 'Engineer',
    current_company: 'Analytical',
    mentorship_available: true,
  },
  { id: 4, user_id: 40, name: 'Grace Hopper', mentorship_available: false },
];

function renderSuggestions(props: SuggestedAlumniProps = {}) {
  return renderWithProviders(
    <>
      <p>Parent content</p>
      <SuggestedAlumni {...props} />
    </>,
  ).queryClient;
}

const region = () => screen.getByRole('region', { name: 'Suggested alumni' });

afterEach(() => {
  resetApi();
});

describe('SuggestedAlumni', () => {
  it('lists each suggested person as a link to their profile', async () => {
    mockSuggestions(ok(people));
    renderSuggestions();

    const links = await within(region()).findAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/alumni/3', '/alumni/4']);
    expect(links[0]).toHaveAccessibleName('Ada Lovelace Engineer, Analytical Mentor');
    expect(links[1]).toHaveAccessibleName('Grace Hopper');
    expect(requests.map((request) => request.url)).toEqual([SUGGESTIONS_URL]);
  });

  it("caches under the alumni root, so the admin page's invalidation reaches it", async () => {
    mockSuggestions(ok(people));
    const client = renderSuggestions();
    await within(region()).findAllByRole('link');
    expect(client.getQueryData(['alumni', 'suggestions'])).toEqual(people);
  });

  it('titles the card with a level-2 heading by default', () => {
    mockSuggestions(never);
    renderSuggestions();
    expect(screen.getByRole('heading', { level: 2, name: 'Suggested alumni' })).toBeInTheDocument();
  });

  it('takes the heading level from the parent', () => {
    mockSuggestions(never);
    renderSuggestions({ headingLevel: 3 });
    expect(screen.getByRole('heading', { level: 3, name: 'Suggested alumni' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('shows skeleton rows and an announced loading status while it loads', () => {
    mockSuggestions(never);
    renderSuggestions();
    expect(within(region()).getByRole('status')).toHaveTextContent('Loading suggestions…');
    const busy = region().querySelector('[aria-busy="true"]');
    expect(busy).not.toBeNull();
    expect(busy?.querySelectorAll('[data-skeleton]')).toHaveLength(3);
    // A live region inside a busy subtree may not be announced (REFL-004).
    expect(busy?.contains(within(region()).getByRole('status'))).toBe(false);
    expect(within(region()).queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a short note when there is nobody to suggest', async () => {
    mockSuggestions(ok([]));
    renderSuggestions();
    expect(await within(region()).findByText(/No suggestions yet/)).toBeInTheDocument();
    expect(within(region()).queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows an inline error with Retry, and Retry loads the people', async () => {
    mockSuggestions(fail(400), ok(people));
    const user = userEvent.setup();
    renderSuggestions();

    const alert = await within(region()).findByRole('alert');
    expect(alert).toHaveTextContent("Suggestions didn't load");
    await user.click(within(region()).getByRole('button', { name: 'Retry' }));

    expect(await within(region()).findByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(region()).queryByRole('alert')).not.toBeInTheDocument();
    expect(requests).toHaveLength(2);
  });

  it('keeps its failure to itself: the parent content stays', async () => {
    mockSuggestions(fail(400));
    renderSuggestions();
    await within(region()).findByRole('alert');
    expect(screen.getByText('Parent content')).toBeInTheDocument();
  });

  it('keeps the people shown when a background refetch fails', async () => {
    mockSuggestions(ok(people), fail(400));
    const client = renderSuggestions();
    await within(region()).findByText('Ada Lovelace');

    await act(() => client.refetchQueries({ queryKey: ['alumni', 'suggestions'] }));

    expect(client.getQueryState(['alumni', 'suggestions'])?.status).toBe('error');
    expect(await within(region()).findByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(region()).queryByRole('alert')).not.toBeInTheDocument();
  });
});
