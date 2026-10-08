import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToken } from '@/services/authToken';
import { httpClient } from '@/services/httpClient';
import { Composer } from './Composer';
import { POST_MAX_LENGTH } from './constants';
import { fakeApi, makePost, ME, originalAdapter, renderWith, signIn, testClient } from './testKit';

let api: ReturnType<typeof fakeApi>;

beforeEach(() => {
  signIn();
  api = fakeApi();
});

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter;
  clearToken();
});

function renderComposer(me: typeof ME | null = ME) {
  renderWith(<Composer me={me ?? undefined} />, testClient(me));
  return screen.getByRole('textbox', { name: 'Write a post' });
}

describe('Composer', () => {
  function stubWidth(wide: boolean) {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: wide, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
  }

  it('greets by first name in the placeholder on desktop', () => {
    stubWidth(true);
    try {
      expect(renderComposer()).toHaveAttribute('placeholder', "What's on your mind, Sophia?");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('drops the name on a phone, as in the phone design', () => {
    stubWidth(false);
    try {
      expect(renderComposer()).toHaveAttribute('placeholder', "What's on your mind?");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('falls back to a plain prompt without a user', () => {
    expect(renderComposer(null)).toHaveAttribute('placeholder', "What's on your mind?");
  });

  it('keeps Post disabled while the text is blank or only spaces', async () => {
    const field = renderComposer();
    const post = screen.getByRole('button', { name: 'Post' });
    expect(post).toBeDisabled();
    await userEvent.type(field, '   ');
    expect(post).toBeDisabled();
    await userEvent.type(field, 'Hi');
    expect(post).toBeEnabled();
  });

  it('sends the trimmed text, clears the field and keeps focus in it', async () => {
    api.on('post /posts', { ok: makePost(30, { user_id: ME.user_id }) });
    const field = renderComposer();
    await userEvent.type(field, '  Hello alumni  ');
    await userEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(api.count('post /posts')).toBe(1);
    });
    const sent = api.calls.find((c) => c.method === 'post');
    expect(JSON.parse(String(sent?.data))).toEqual({ caption: 'Hello alumni' });
    expect(field).toHaveValue('');
    expect(field).toHaveFocus();
  });

  it('caps the text and shows the characters left only near the cap', () => {
    const field = renderComposer();
    expect(field).toHaveAttribute('maxLength', String(POST_MAX_LENGTH));
    expect(screen.queryByText(/characters? left/)).toBeNull();

    fireEvent.change(field, { target: { value: 'x'.repeat(POST_MAX_LENGTH - 150) } });
    const count = screen.getByText('150 characters left');
    expect(field).toHaveAttribute('aria-describedby', count.id);

    fireEvent.change(field, { target: { value: 'x'.repeat(POST_MAX_LENGTH - 1) } });
    expect(screen.getByText('1 character left')).toBeInTheDocument();
  });

  it('shows the API message when the post is refused', async () => {
    api.on('post /posts', { fail: 403, message: 'Not allowed' });
    const field = renderComposer();
    await userEvent.type(field, 'Hello');
    await userEvent.click(screen.getByRole('button', { name: 'Post' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Your post wasn't sharedNot allowed",
    );
    expect(field).toHaveValue('Hello');
  });
});
