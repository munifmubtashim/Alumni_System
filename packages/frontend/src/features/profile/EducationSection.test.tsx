import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EducationSection } from './EducationSection';

function entry() {
  const region = screen.getByRole('region', { name: 'Education' });
  return within(region).getByRole('listitem');
}

describe('EducationSection', () => {
  it('shows the university as the title and "department · Class of YYYY" under it', () => {
    render(
      <EducationSection
        alumni={{ university: 'Univ. of Toronto', department: 'Design', graduation_year: 2017 }}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Education' })).toBeInTheDocument();
    const paragraphs = within(entry()).getAllByText(/.+/, { selector: 'p' });
    expect(paragraphs.map((p) => p.textContent)).toEqual([
      'Univ. of Toronto',
      'Design · Class of 2017',
    ]);
  });

  it('leaves a missing department out without a stray separator', () => {
    render(<EducationSection alumni={{ university: 'MIT', graduation_year: 2020 }} />);
    expect(within(entry()).getByText('Class of 2020')).toBeInTheDocument();
    expect(entry()).not.toHaveTextContent('·');
  });

  it('shows the university alone when department and year are missing', () => {
    render(<EducationSection alumni={{ university: 'MIT', department: '  ' }} />);
    expect(entry()).toHaveTextContent(/^MIT$/);
  });

  it('uses the department line as the title when there is no university', () => {
    render(<EducationSection alumni={{ department: 'Economics', graduation_year: 2015 }} />);
    expect(entry()).toHaveTextContent(/^Economics · Class of 2015$/);
  });

  it('shows no year range or placeholder without a degree or start year', () => {
    render(
      <EducationSection
        alumni={{ university: 'MIT', graduation_year: 2020, degree: ' ', start_year: null }}
      />,
    );
    expect(entry()).not.toHaveTextContent(/–|Present|B\.Sc/);
  });

  it('shows "degree · start–graduation" under the university (S3)', () => {
    render(
      <EducationSection
        alumni={{
          university: 'University of Toronto',
          department: 'Design',
          degree: 'B.Sc. Product Design',
          start_year: 2013,
          graduation_year: 2017,
        }}
      />,
    );
    const paragraphs = within(entry()).getAllByText(/.+/, { selector: 'p' });
    expect(paragraphs.map((p) => p.textContent)).toEqual([
      'University of Toronto',
      'B.Sc. Product Design · 2013–2017',
    ]);
  });

  it('shows the degree line as the title when there is no university', () => {
    render(<EducationSection alumni={{ degree: 'MBA', start_year: 2019 }} />);
    expect(entry()).toHaveTextContent(/^MBA · 2019$/);
  });

  it('is not rendered when university, department and year are all empty', () => {
    const { container } = render(
      <EducationSection
        alumni={{
          university: '',
          department: ' ',
          graduation_year: null,
          degree: null,
          start_year: null,
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
