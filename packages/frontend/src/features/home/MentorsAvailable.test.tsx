import type { AlumniListItem, AlumniListResponse } from '@alumni/shared';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { fail, mockApi, never, ok, renderHome, requests, resetApi } from './homeTestKit';
import { MentorsAvailable } from './MentorsAvailable';

afterEach(resetApi);

function mentor(id: number, name: string): AlumniListItem {
  return { id, user_id: id * 10, name, job_title: 'Engineer', mentorship_available: true };
}

function page(items: AlumniListItem[]): AlumniListResponse {
  return { items, total: items.length };
}

const five = page([
  mentor(1, 'Ada'),
  mentor(7, 'Me Myself'),
  mentor(2, 'Grace'),
  mentor(3, 'Linus'),
  mentor(4, 'Barbara'),
]);

const region = () => screen.getByRole('region', { name: 'Mentors available' });

describe('MentorsAvailable', () => {
  it('asks for mentors only and lists up to 4, never the signed-in user', async () => {
    mockApi({ '/alumni': ok(five) });
    renderHome(<MentorsAvailable ownAlumniId={7} />);

    const links = await within(region()).findAllByRole('link', { name: /Engineer/ });
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/alumni/1',
      '/alumni/2',
      '/alumni/3',
      '/alumni/4',
    ]);
    expect(links[0]).toHaveAccessibleName('Ada Engineer Mentor');
    expect(requests).toEqual([
      { url: '/alumni', params: { mentorship: 'true', page: 1, pageSize: 5 } },
    ]);
  });

  it('shows 4 when the user is not among them', async () => {
    mockApi({ '/alumni': ok(five) });
    renderHome(<MentorsAvailable ownAlumniId={null} />);
    expect(await within(region()).findAllByRole('link', { name: /Engineer/ })).toHaveLength(4);
  });

  it('links "Browse directory" to the directory', () => {
    mockApi({ '/alumni': never });
    renderHome(<MentorsAvailable ownAlumniId={null} />);
    expect(within(region()).getByRole('link', { name: 'Browse directory' })).toHaveAttribute(
      'href',
      '/directory',
    );
  });

  it('caches under the alumni root', async () => {
    mockApi({ '/alumni': ok(five) });
    const { queryClient } = renderHome(<MentorsAvailable ownAlumniId={null} />);
    await within(region()).findAllByRole('link', { name: /Engineer/ });
    expect(queryClient.getQueryData(['alumni', 'mentors'])).toEqual(five);
  });

  it('shows skeleton rows and an announced loading status while it loads', () => {
    mockApi({ '/alumni': never });
    renderHome(<MentorsAvailable ownAlumniId={null} />);
    expect(within(region()).getByRole('status')).toHaveTextContent('Loading mentors…');
    const busy = region().querySelector('[aria-busy="true"]');
    expect(busy?.querySelectorAll('[data-skeleton]')).toHaveLength(3);
  });

  it('shows a note when the only mentor is the user', async () => {
    mockApi({ '/alumni': ok(page([mentor(7, 'Me Myself')])) });
    renderHome(<MentorsAvailable ownAlumniId={7} />);
    expect(await within(region()).findByText(/No mentors available yet/)).toBeInTheDocument();
  });

  it('shows its own error with Retry, and Retry loads the mentors', async () => {
    mockApi({ '/alumni': [fail(), ok(five)] });
    const user = userEvent.setup();
    renderHome(<MentorsAvailable ownAlumniId={null} />);

    expect(await within(region()).findByRole('alert')).toHaveTextContent("Mentors didn't load");
    await user.click(within(region()).getByRole('button', { name: 'Retry' }));

    expect(await within(region()).findByText('Ada')).toBeInTheDocument();
    expect(within(region()).queryByRole('alert')).not.toBeInTheDocument();
  });
});
