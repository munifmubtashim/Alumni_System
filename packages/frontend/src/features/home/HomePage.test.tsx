import type { AlumniListResponse, Post, SuggestedAlumni } from '@alumni/shared';
import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HomePage } from './HomePage';
import { fail, mockApi, ok, profile, renderHome, resetApi } from './homeTestKit';

afterEach(resetApi);

const posts: Post[] = [{ id: 1, user_id: 10, caption: 'Hello all', author_name: 'Ada' }];
const mentors: AlumniListResponse = {
  items: [{ id: 2, user_id: 20, name: 'Grace Mentor', mentorship_available: true }],
  total: 1,
};
const suggestions: SuggestedAlumni = [{ id: 3, user_id: 30, name: 'Linus Suggested' }];

const all = { '/posts': ok(posts), '/alumni': ok(mentors), '/alumni/suggestions': ok(suggestions) };

const section = (name: string) => screen.getByRole('region', { name });

describe('HomePage', () => {
  it('greets the user by first name with the subtitle', () => {
    mockApi({});
    renderHome(<HomePage />, profile('alumni', { name: 'Amina Rao' }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome back, Amina' }),
    ).toBeInTheDocument();
    expect(screen.getByText("Here's what's happening in your alumni network.")).toBeInTheDocument();
  });

  it('uses a one-word name as it is', () => {
    mockApi({});
    renderHome(<HomePage />, profile('student', { name: 'Jonas' }));
    expect(screen.getByRole('heading', { name: 'Welcome back, Jonas' })).toBeInTheDocument();
  });

  it('greets without a name when the name is blank', () => {
    mockApi({});
    renderHome(<HomePage />, profile('alumni', { name: '  ' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeInTheDocument();
  });

  it('shows the completeness card, latest posts, mentors and suggested alumni', async () => {
    mockApi(all);
    renderHome(<HomePage />, profile('alumni'));

    expect(section('Complete your profile')).toBeInTheDocument();
    expect(
      await within(section('Latest from the feed')).findByText('Hello all'),
    ).toBeInTheDocument();
    expect(
      await within(section('Mentors available')).findByText('Grace Mentor'),
    ).toBeInTheDocument();
    expect(
      await within(section('Suggested alumni')).findByText('Linus Suggested'),
    ).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Complete your profile',
      'Latest from the feed',
      'Mentors available',
      'Suggested alumni',
    ]);
  });

  it('has no quick-link cards, stats or counts', () => {
    mockApi({});
    renderHome(<HomePage />, profile('alumni'));

    expect(screen.queryByText('Browse the directory')).not.toBeInTheDocument();
    expect(screen.queryByText('Catch up on the feed')).not.toBeInTheDocument();
    expect(screen.queryByText(/Total alumni|Students|Posts$/)).not.toBeInTheDocument();
  });

  it('keeps every other section when one fails', async () => {
    mockApi({ ...all, '/posts': fail() });
    renderHome(<HomePage />, profile('alumni'));

    expect(await within(section('Latest from the feed')).findByRole('alert')).toHaveTextContent(
      "Posts didn't load",
    );
    expect(
      await within(section('Mentors available')).findByText('Grace Mentor'),
    ).toBeInTheDocument();
    expect(
      await within(section('Suggested alumni')).findByText('Linus Suggested'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('keeps the posts when mentors and suggestions both fail', async () => {
    mockApi({ '/posts': ok(posts), '/alumni': fail(), '/alumni/suggestions': fail() });
    renderHome(<HomePage />, profile('alumni'));

    expect(
      await within(section('Latest from the feed')).findByText('Hello all'),
    ).toBeInTheDocument();
    expect(await within(section('Mentors available')).findByRole('alert')).toBeInTheDocument();
    expect(await within(section('Suggested alumni')).findByRole('alert')).toBeInTheDocument();
  });

  it('shows no completeness card for an account without a profile row', () => {
    mockApi({});
    renderHome(<HomePage />, profile('none'));
    expect(screen.queryByRole('region', { name: 'Complete your profile' })).not.toBeInTheDocument();
    expect(section('Latest from the feed')).toBeInTheDocument();
  });

  it('renders nothing without a loaded profile', () => {
    mockApi({});
    const { container } = renderHome(<HomePage />);
    expect(container).toBeEmptyDOMElement();
  });
});
