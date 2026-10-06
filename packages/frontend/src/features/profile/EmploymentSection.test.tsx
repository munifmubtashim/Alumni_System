import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmploymentSection } from './EmploymentSection';

const region = () => screen.getByRole('region', { name: 'Employment' });

describe('EmploymentSection', () => {
  it('shows one entry "job title · company", then the experience paragraph', () => {
    render(
      <EmploymentSection
        alumni={{
          job_title: 'Design Lead',
          current_company: 'Terra Climate',
          experience: 'Ten years in product design.',
        }}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Employment' })).toBeInTheDocument();
    const items = within(region()).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent(/^Design Lead · Terra Climate$/);
    const experience = within(region()).getByText('Ten years in product design.');
    expect(experience.closest('li')).toBeNull();
  });

  it.each([
    [{ job_title: 'Engineer' }, 'Engineer'],
    [{ current_company: 'Acme' }, 'Acme'],
  ])('shows either part alone, without a separator (%j)', (alumni, text) => {
    render(<EmploymentSection alumni={alumni} />);
    expect(within(region()).getByRole('listitem')).toHaveTextContent(new RegExp(`^${text}$`));
  });

  it('shows no dates and no "Present"', () => {
    render(<EmploymentSection alumni={{ job_title: 'Engineer', current_company: 'Acme' }} />);
    expect(region()).not.toHaveTextContent(/Present|\d{4}/);
  });

  it('shows only the experience when job title and company are empty', () => {
    render(<EmploymentSection alumni={{ job_title: ' ', experience: 'Freelance work.' }} />);
    expect(within(region()).queryByRole('list')).not.toBeInTheDocument();
    expect(within(region()).getByText('Freelance work.')).toBeInTheDocument();
  });

  it('renders markup in the experience as literal text', () => {
    render(<EmploymentSection alumni={{ experience: '<b>x</b>' }} />);
    expect(within(region()).getByText('<b>x</b>')).toBeInTheDocument();
    expect(region().querySelector('b')).toBeNull();
  });

  it('is not rendered when job title, company and experience are all empty', () => {
    const { container } = render(
      <EmploymentSection alumni={{ job_title: '', current_company: '  ', experience: '' }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
