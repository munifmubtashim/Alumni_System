import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminStats } from './AdminStats';
import { fail, held, mockApi, ok, page, renderAt, restoreApi, STATS } from './testKit';

afterEach(() => {
  restoreApi();
});

const emptyTable = ok(page([], 0));

/** The value shown under a card's label. */
function valueOf(label: string): HTMLElement {
  const term = screen.getByText(label, { selector: 'dt' });
  const value = term.nextElementSibling;
  if (!(value instanceof HTMLElement)) throw new Error(`no value for ${label}`);
  return value;
}

describe('AdminStats', () => {
  it('shows the four counts with thousands separators, in S6 order', async () => {
    mockApi(ok(STATS), emptyTable);
    renderAt(<AdminStats />);

    expect(await screen.findByText('1,842')).toBeInTheDocument();
    expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
      'Total alumni',
      'Students',
      'Posts',
      'Mentors available',
    ]);
    expect(valueOf('Total alumni')).toHaveTextContent('1,842');
    expect(valueOf('Students')).toHaveTextContent('230');
    expect(valueOf('Posts')).toHaveTextContent('12,045');
    expect(valueOf('Mentors available')).toHaveTextContent('312');
    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument();
  });

  it('shows a skeleton in each card while loading', async () => {
    const request = held();
    mockApi(request.responder, emptyTable);
    renderAt(<AdminStats />);

    const terms = await screen.findAllByRole('term');
    expect(terms).toHaveLength(4);
    const list = terms[0]?.closest('dl');
    expect(list).toHaveAttribute('aria-busy', 'true');
    for (const label of ['Total alumni', 'Students', 'Posts', 'Mentors available']) {
      expect(valueOf(label).querySelector('[aria-hidden="true"]')).not.toBeNull();
      expect(valueOf(label)).toHaveTextContent('');
    }

    act(() => {
      request.release(ok(STATS));
    });
    expect(await screen.findByText('1,842')).toBeInTheDocument();
    expect(list).not.toHaveAttribute('aria-busy');
  });

  it('shows an error with Retry in place of the cards, and Retry loads them', async () => {
    const user = userEvent.setup();
    let calls = 0;
    mockApi((config) => {
      calls += 1;
      return calls === 1 ? fail(403)(config) : ok(STATS)(config);
    }, emptyTable);
    renderAt(<AdminStats />);

    expect(await screen.findByText("The counts didn't load")).toBeInTheDocument();
    expect(screen.queryByRole('term')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('1,842')).toBeInTheDocument();
    expect(screen.queryByText("The counts didn't load")).not.toBeInTheDocument();
    expect(calls).toBe(2);
  });
});
