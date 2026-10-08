import type { AlumniListItem } from '@alumni/shared';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AlumniCardList } from './AlumniCardList';
import { AlumniTable, type AlumniTableProps } from './AlumniTable';
import { ADMIN_PAGE_SIZE } from './queries';

const AMIRA: AlumniListItem = {
  id: 7,
  user_id: 70,
  name: 'Amira Mendes',
  graduation_year: 2017,
  department: 'Product Design',
  university: 'University of Toronto',
  mentorship_available: true,
};

const JONAS: AlumniListItem = {
  id: 8,
  user_id: 80,
  name: 'Jonas Kessler',
  graduation_year: null,
  department: '',
  mentorship_available: false,
};

function renderTable(props: Partial<AlumniTableProps> = {}) {
  const handlers = { onSort: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() };
  render(
    <>
      <h2 id="list-title">Alumni</h2>
      <AlumniTable
        labelledBy="list-title"
        rows={[AMIRA, JONAS]}
        sort="name"
        order="asc"
        {...handlers}
        {...props}
      />
    </>,
  );
  return handlers;
}

describe('AlumniTable', () => {
  it('renders S6 columns and one row per alumnus, named by its heading', () => {
    renderTable();

    const table = screen.getByRole('table', { name: 'Alumni' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((header) => header.textContent),
    ).toEqual(['Name↓', 'Grad. year', 'Department', 'University', 'Mentor', 'Actions']);
    const [, first, second, ...rest] = within(table).getAllByRole('row');
    if (first === undefined || second === undefined) throw new Error('expected two rows');
    expect(rest).toHaveLength(0);
    expect(within(first).getByRole('rowheader')).toHaveTextContent('Amira Mendes');
    expect(first).toHaveTextContent('2017');
    expect(first).toHaveTextContent('Product Design');
    expect(first).toHaveTextContent('University of Toronto');
    expect(first).toHaveTextContent('Yes');
    expect(second).toHaveTextContent('No');
    // Missing values show a dash read out as "Not set".
    expect(within(second).getAllByText('Not set')).toHaveLength(3);
  });

  it('marks the active sort column with aria-sort and the S6 arrow', () => {
    const { rerender } = render(
      <AlumniTable
        labelledBy="x"
        rows={[AMIRA]}
        sort="graduationYear"
        order="desc"
        onSort={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const year = screen.getByRole('columnheader', { name: /Grad\. year/ });
    const name = screen.getByRole('columnheader', { name: /^Name/ });
    expect(year).toHaveAttribute('aria-sort', 'descending');
    expect(year).toHaveTextContent('Grad. year↑');
    expect(name).not.toHaveAttribute('aria-sort');
    expect(name).toHaveTextContent(/^Name$/);

    rerender(
      <AlumniTable
        labelledBy="x"
        rows={[AMIRA]}
        sort="name"
        order="asc"
        onSort={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(name).toHaveAttribute('aria-sort', 'ascending');
    expect(name).toHaveTextContent('Name↓');
  });

  it('calls onSort with the clicked column', async () => {
    const user = userEvent.setup();
    const { onSort } = renderTable();

    await user.click(screen.getByRole('button', { name: 'Grad. year' }));
    expect(onSort).toHaveBeenLastCalledWith('graduationYear');
    await user.click(screen.getByRole('button', { name: /^Name/ }));
    expect(onSort).toHaveBeenLastCalledWith('name');
  });

  it('passes the row and the pressed button to Edit and Delete', async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderTable();

    const edit = screen.getByRole('button', { name: 'Edit Amira Mendes' });
    await user.click(edit);
    expect(onEdit).toHaveBeenCalledWith(AMIRA, edit);

    const remove = screen.getByRole('button', { name: 'Delete Jonas Kessler' });
    await user.click(remove);
    expect(onDelete).toHaveBeenCalledWith(JONAS, remove);
  });

  it('shows skeleton rows, marked busy and hidden, while loading', () => {
    renderTable({ rows: undefined });

    const table = screen.getByRole('table', { hidden: true });
    expect(table).toHaveAttribute('aria-busy', 'true');
    const bodyRows = table.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(ADMIN_PAGE_SIZE);
    for (const row of bodyRows) expect(row).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Grad. year' })).toBeInTheDocument();
  });
});

describe('AlumniCardList', () => {
  it('shows each alumnus with "year · department" and the two buttons', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <>
        <h2 id="list-title">Alumni</h2>
        <AlumniCardList
          labelledBy="list-title"
          rows={[AMIRA, JONAS]}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </>,
    );

    const list = screen.getByRole('list', { name: 'Alumni' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Amira Mendes2017 · Product Design');
    // No year and no department: only the name line.
    expect(items[1]?.querySelectorAll('p')).toHaveLength(1);

    await user.click(within(list).getByRole('button', { name: 'Delete Amira Mendes' }));
    expect(onDelete).toHaveBeenCalledWith(AMIRA, expect.any(HTMLButtonElement));
    await user.click(within(list).getByRole('button', { name: 'Edit Jonas Kessler' }));
    expect(onEdit).toHaveBeenCalledWith(JONAS, expect.any(HTMLButtonElement));
  });
});
