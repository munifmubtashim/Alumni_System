import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

function renderPagination(page: number, totalPages: number) {
  const onPageChange = vi.fn();
  const view = render(
    <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />,
  );
  return { ...view, onPageChange };
}

/** The visible labels of the numbers row, gaps included. */
function numberRow(): string[] {
  const nav = screen.getByRole('navigation', { name: 'Pagination' });
  const list = nav.querySelector('ul');
  if (!list) throw new Error('no page list');
  return Array.from(list.children).map((item) => item.textContent);
}

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = renderPagination(1, 1);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there are no pages', () => {
    const { container } = renderPagination(1, 0);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows both pages for two', () => {
    renderPagination(1, 2);
    expect(numberRow()).toEqual(['1', '2']);
  });

  it('shows every page for five', () => {
    renderPagination(3, 5);
    expect(numberRow()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('shows the design window on the first, middle and last of 24 pages', () => {
    const { rerender, onPageChange } = renderPagination(1, 24);
    expect(numberRow()).toEqual(['1', '2', '3', '…', '24']);

    rerender(<Pagination page={12} totalPages={24} onPageChange={onPageChange} />);
    expect(numberRow()).toEqual(['1', '…', '11', '12', '13', '…', '24']);

    rerender(<Pagination page={24} totalPages={24} onPageChange={onPageChange} />);
    expect(numberRow()).toEqual(['1', '…', '22', '23', '24']);
  });

  it('marks only the current page with aria-current', () => {
    renderPagination(12, 24);
    expect(screen.getByRole('button', { name: 'Page 12' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 11' })).not.toHaveAttribute('aria-current');
  });

  it('hides the ellipsis from assistive tech', () => {
    renderPagination(12, 24);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    const gaps = within(nav)
      .getAllByText('…')
      .filter((el) => el.tagName === 'LI');
    expect(gaps).toHaveLength(2);
    for (const gap of gaps) expect(gap).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows "Page x of y" for small screens', () => {
    renderPagination(3, 24);
    expect(screen.getByText('Page 3 of 24')).toBeInTheDocument();
  });

  it('disables Prev on the first page and Next on the last', () => {
    const { rerender, onPageChange } = renderPagination(1, 24);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();

    rerender(<Pagination page={24} totalPages={24} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('calls onPageChange with the page for Prev, Next and a number', async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination(12, 24);

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(11);

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(13);

    await user.click(screen.getByRole('button', { name: 'Page 24' }));
    expect(onPageChange).toHaveBeenLastCalledWith(24);
    expect(onPageChange).toHaveBeenCalledTimes(3);
  });
});
