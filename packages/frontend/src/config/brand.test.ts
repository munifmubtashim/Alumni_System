import { describe, expect, it } from 'vitest';
import { PASSWORD_RESET_SUBJECT, SUPPORT_EMAIL, supportMailto } from './brand';

describe('supportMailto', () => {
  it('builds a mailto link to the support address', () => {
    expect(supportMailto('Hi')).toBe(`mailto:${SUPPORT_EMAIL}?subject=Hi`);
  });

  it('URL-encodes the subject', () => {
    expect(supportMailto(PASSWORD_RESET_SUBJECT)).toBe(
      'mailto:support@alma.app?subject=Password%20reset%20request',
    );
    expect(supportMailto('a&b=c?')).toBe('mailto:support@alma.app?subject=a%26b%3Dc%3F');
  });
});
