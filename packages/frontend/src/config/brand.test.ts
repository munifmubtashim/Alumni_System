import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import { BRAND_NAME, PASSWORD_RESET_SUBJECT, SUPPORT_EMAIL, supportMailto } from './brand';

// index.html is static, so its <title> can't import BRAND_NAME; this keeps the
// two from drifting apart (same idea as the theme key test, G01).
describe('index.html', () => {
  it('uses BRAND_NAME as the tab title', () => {
    const doc = new DOMParser().parseFromString(indexHtml, 'text/html');
    expect(doc.title).toBe(BRAND_NAME);
  });
});

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
