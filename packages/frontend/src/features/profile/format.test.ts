import { describe, expect, it } from 'vitest';
import {
  commentCountText,
  degreeLine,
  educationLine,
  employmentTitle,
  headline,
  safeLinkedInUrl,
} from './format';

describe('headline', () => {
  it('joins job title, company and class year', () => {
    expect(
      headline({
        job_title: 'Design Lead',
        current_company: 'Terra Climate',
        graduation_year: 2017,
      }),
    ).toBe('Design Lead at Terra Climate · Class of 2017');
  });

  it('drops missing parts without stray "at" or "·"', () => {
    expect(headline({ job_title: 'Design Lead', graduation_year: 2017 })).toBe(
      'Design Lead · Class of 2017',
    );
    expect(headline({ current_company: 'Terra Climate', graduation_year: 2017 })).toBe(
      'Terra Climate · Class of 2017',
    );
    expect(headline({ job_title: 'Design Lead', current_company: 'Terra Climate' })).toBe(
      'Design Lead at Terra Climate',
    );
    expect(
      headline({ job_title: '  ', current_company: '', graduation_year: null }),
    ).toBeUndefined();
    expect(headline({ graduation_year: 2017 })).toBe('Class of 2017');
    expect(headline({})).toBeUndefined();
  });
});

describe("headline with the alumnus's own text", () => {
  it('uses the headline instead of job title and company', () => {
    expect(
      headline({
        headline: '  Senior Product Manager at Meridian Health ',
        job_title: 'Design Lead',
        current_company: 'Terra Climate',
        graduation_year: 2017,
      }),
    ).toBe('Senior Product Manager at Meridian Health · Class of 2017');
    expect(headline({ headline: 'Climate designer' })).toBe('Climate designer');
  });

  it.each([null, '', '   ', undefined])('falls back to job and company for headline %j', (h) => {
    expect(
      headline({ headline: h, job_title: 'Design Lead', current_company: 'Terra Climate' }),
    ).toBe('Design Lead at Terra Climate');
  });
});

describe('degreeLine', () => {
  it('joins the degree and the year range', () => {
    expect(degreeLine('B.Sc. Product Design', 2013, 2017)).toBe('B.Sc. Product Design · 2013–2017');
  });

  it('shows one year alone when the other is missing or the same', () => {
    expect(degreeLine('B.Sc.', 2013, null)).toBe('B.Sc. · 2013');
    expect(degreeLine('B.Sc.', undefined, 2017)).toBe('B.Sc. · 2017');
    expect(degreeLine('B.Sc.', 2017, 2017)).toBe('B.Sc. · 2017');
  });

  it('shows the degree alone, or the years alone', () => {
    expect(degreeLine(' B.Sc. ', null, null)).toBe('B.Sc.');
    expect(degreeLine('  ', 2013, 2017)).toBe('2013–2017');
    expect(degreeLine(null, null, 2017)).toBe('2017');
  });

  it('is undefined when degree and both years are missing', () => {
    expect(degreeLine(null, null, null)).toBeUndefined();
    expect(degreeLine(' ', undefined, undefined)).toBeUndefined();
  });
});

describe('educationLine', () => {
  it('uses the degree line when there is a degree or a start year', () => {
    expect(
      educationLine({
        department: 'Design',
        degree: 'B.Sc. Product Design',
        start_year: 2013,
        graduation_year: 2017,
      }),
    ).toBe('B.Sc. Product Design · 2013–2017');
    expect(educationLine({ department: 'Design', start_year: 2013, graduation_year: 2017 })).toBe(
      'Design · 2013–2017',
    );
    expect(educationLine({ degree: 'MBA', graduation_year: 2017 })).toBe('MBA · 2017');
  });

  it('joins department and class year, dropping missing parts', () => {
    expect(educationLine({ department: 'CSE', graduation_year: 2017 })).toBe('CSE · Class of 2017');
    expect(educationLine({ department: ' CSE ' })).toBe('CSE');
    expect(educationLine({ graduation_year: 2017 })).toBe('Class of 2017');
    expect(educationLine({ department: ' ', graduation_year: null })).toBeUndefined();
  });
});

describe('employmentTitle', () => {
  it('joins job title and company, dropping missing parts', () => {
    expect(employmentTitle({ job_title: 'Engineer', current_company: 'Acme' })).toBe(
      'Engineer · Acme',
    );
    expect(employmentTitle({ job_title: 'Engineer' })).toBe('Engineer');
    expect(employmentTitle({ current_company: 'Acme' })).toBe('Acme');
    expect(employmentTitle({ job_title: '', current_company: ' ' })).toBeUndefined();
  });
});

describe('safeLinkedInUrl', () => {
  it('accepts absolute http and https addresses', () => {
    expect(safeLinkedInUrl('https://www.linkedin.com/in/x')).toBe('https://www.linkedin.com/in/x');
    expect(safeLinkedInUrl('  http://linkedin.com/in/x  ')).toBe('http://linkedin.com/in/x');
  });

  it('rejects other schemes, relative and malformed values', () => {
    expect(safeLinkedInUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeLinkedInUrl('JavaScript:alert(1)')).toBeUndefined();
    expect(safeLinkedInUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(safeLinkedInUrl('/in/x')).toBeUndefined();
    expect(safeLinkedInUrl('linkedin.com/in/x')).toBeUndefined();
    expect(safeLinkedInUrl('https://')).toBeUndefined();
    expect(safeLinkedInUrl('not a url')).toBeUndefined();
    expect(safeLinkedInUrl('')).toBeUndefined();
    expect(safeLinkedInUrl(null)).toBeUndefined();
    expect(safeLinkedInUrl(undefined)).toBeUndefined();
  });
});

describe('commentCountText', () => {
  it('uses the singular only for one', () => {
    expect(commentCountText(0)).toBe('0 comments');
    expect(commentCountText(1)).toBe('1 comment');
    expect(commentCountText(14)).toBe('14 comments');
  });

  it('treats bad counts as zero', () => {
    expect(commentCountText(Number.NaN)).toBe('0 comments');
    expect(commentCountText(-3)).toBe('0 comments');
  });
});
