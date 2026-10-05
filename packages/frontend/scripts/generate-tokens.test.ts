// @vitest-environment node
import { describe, expect, it } from 'vitest';
import tokensJson from '../../../docs/design/design-system/tokens.json';
import { readTokensCss, renderTokensCss, type TokensJson } from './generate-tokens.ts';

const tokens: TokensJson = tokensJson;
const rendered = renderTokensCss(tokens);

/** The body of the CSS rule whose selector list ends with `selectorEnd`. */
function ruleBody(css: string, selectorEnd: string): string {
  const start = css.indexOf(`${selectorEnd} {`);
  if (start === -1) throw new Error(`no rule for ${selectorEnd}`);
  const open = css.indexOf('{', start);
  return css.slice(open + 1, css.indexOf('}', open));
}

function countDeclarations(css: string, name: string): number {
  return css.split('\n').filter((line) => line.trim().startsWith(`--${name}:`)).length;
}

describe('tokens.css', () => {
  it('matches what the generator renders from tokens.json', () => {
    expect(readTokensCss(), 'tokens.css is stale — run npm run tokens').toBe(rendered);
  });

  it('renders the same output every time', () => {
    expect(renderTokensCss(tokens)).toBe(rendered);
  });

  it('defines every color token in both themes, light being the default', () => {
    expect(tokens.color.tokens).toHaveLength(15);
    expect(rendered).toContain(":root,\n:root[data-theme='light'] {");

    for (const theme of ['light', 'dark']) {
      const body = ruleBody(rendered, `:root[data-theme='${theme}']`);
      expect(body).toContain(`color-scheme: ${theme};`);
      for (const token of tokens.color.tokens) {
        expect(body).toContain(`--${token.name}: ${token.value[theme] ?? 'missing'};`);
      }
    }
    for (const token of tokens.color.tokens) {
      expect(countDeclarations(rendered, token.name)).toBe(2);
    }
  });

  it('defines each spacing, radius and type token exactly once', () => {
    const spacing = tokens.spacing.tokens.map((t) => t.name);
    const radius = tokens.radius.tokens.map((t) => t.name);
    const styles = tokens.type.groups.flatMap((g) => g.styles.map((s) => s.name));
    expect(spacing).toHaveLength(8);
    expect(radius).toHaveLength(4);
    expect(styles).toHaveLength(8);

    for (const name of [...spacing, ...radius, 'font-sans']) {
      expect(countDeclarations(rendered, name), name).toBe(1);
    }
    for (const style of styles) {
      for (const suffix of ['', '-size', '-line', '-weight']) {
        expect(countDeclarations(rendered, `text-${style}${suffix}`), style + suffix).toBe(1);
      }
    }
  });

  it('converts spacing and type to rem, keeps radii in px', () => {
    expect(rendered).toContain('--space-4: 1rem;');
    expect(rendered).toContain('--text-body: 400 1rem/1.625rem var(--font-sans);');
    expect(rendered).toContain('--radius-lg: 14px;');
  });

  it("puts the self-hosted 'Inter Variable' face first in the font stack", () => {
    expect(rendered).toMatch(/--font-sans: 'Inter Variable', 'Inter', /);
  });

  it('rejects a token value that is not px', () => {
    const bad: TokensJson = {
      ...tokens,
      spacing: { tokens: [{ name: 'space-1', value: '1rem' }] },
    };
    expect(() => renderTokensCss(bad)).toThrow(/expected a px value/);
  });
});
