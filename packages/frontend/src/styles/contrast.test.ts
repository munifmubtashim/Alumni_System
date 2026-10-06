// @vitest-environment node
// WCAG 2.x contrast for the color pairs the UI primitives actually use, in both
// themes. The pair list and the accepted exceptions mirror REQ-001
// architecture.md → Contrast. A token edit that drops a pair below its minimum
// (or makes an accepted exception worse than its recorded ratio) fails here.
import { describe, expect, it } from 'vitest';
import tokensJson from '../../../../docs/design/design-system/tokens.json';

type Theme = 'light' | 'dark';

const colors = new Map(tokensJson.color.tokens.map((t) => [t.name, t.value]));

function color(name: string, theme: Theme): string {
  const value = colors.get(name)?.[theme];
  if (!value) throw new Error(`unknown color token ${name}`);
  return value;
}

function channel(hex: string, offset: number): number {
  const c = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5; // WCAG 1.4.3, normal-size text
const NON_TEXT = 3; // WCAG 1.4.11, UI component boundaries and focus indicators

interface Pair {
  fg: string;
  bg: string;
  min: number;
  use: string;
}

const PAIRS: Pair[] = [
  { fg: 'ink-primary', bg: 'surface-page', min: TEXT, use: 'body text' },
  { fg: 'ink-primary', bg: 'surface-raised', min: TEXT, use: 'text in a Card' },
  { fg: 'ink-primary', bg: 'surface-sunken', min: TEXT, use: 'Input value text' },
  { fg: 'ink-secondary', bg: 'surface-page', min: TEXT, use: 'helper text, labels' },
  { fg: 'ink-secondary', bg: 'surface-raised', min: TEXT, use: 'helper text in a Card' },
  { fg: 'ink-secondary', bg: 'surface-sunken', min: TEXT, use: 'neutral/status Tag text' },
  { fg: 'ink-secondary', bg: 'surface-sunken', min: TEXT, use: 'Input placeholder, at rest' },
  { fg: 'ink-secondary', bg: 'surface-raised', min: TEXT, use: 'Input placeholder, focused' },
  { fg: 'accent', bg: 'surface-page', min: TEXT, use: 'link text, skip link' },
  { fg: 'accent', bg: 'surface-raised', min: TEXT, use: 'skip link, RouteError link in a Card' },
  {
    fg: 'accent-strong',
    bg: 'surface-raised',
    min: TEXT,
    use: 'secondary Button label, hover; Chip remove icon, hover',
  },
  { fg: 'accent-strong', bg: 'surface-sunken', min: TEXT, use: 'ghost Button label, hover' },
  { fg: 'accent-ink', bg: 'accent', min: TEXT, use: 'primary Button label' },
  { fg: 'accent-ink', bg: 'accent-strong', min: TEXT, use: 'primary Button label, hover' },
  {
    fg: 'accent-strong',
    bg: 'accent-soft',
    min: TEXT,
    use: 'accent Tag text, Avatar initials, Chip text',
  },
  { fg: 'accent', bg: 'accent-soft', min: NON_TEXT, use: 'focus outline on a Chip button' },
  { fg: 'error', bg: 'surface-page', min: TEXT, use: 'Input error text on the page' },
  { fg: 'error', bg: 'surface-raised', min: TEXT, use: 'Input error text in a Card' },
  { fg: 'error', bg: 'surface-sunken', min: TEXT, use: 'Input error text on a sunken panel' },
  { fg: 'ink-primary', bg: 'surface-sunken', min: TEXT, use: 'Alert text' },
  { fg: 'ink-primary', bg: 'accent-soft', min: TEXT, use: 'highlighted Menu item' },
  { fg: 'accent', bg: 'surface-page', min: NON_TEXT, use: 'focus outline' },
  { fg: 'accent', bg: 'surface-raised', min: NON_TEXT, use: 'Input focus border' },
  { fg: 'accent', bg: 'surface-sunken', min: NON_TEXT, use: 'auth panel check marks, Logo' },
  { fg: 'ink-secondary', bg: 'surface-sunken', min: NON_TEXT, use: 'show/hide password icon' },
];

// Accepted exceptions: the ratio is the floor recorded in architecture.md;
// the test fails if a token change makes the pair any worse.
const EXCEPTIONS: (Pair & { recorded: Record<Theme, number>; reason: string })[] = [
  // The Input's resting border is border-strong (not the design's
  // border-subtle) to make the edge easier to find; still under 3:1 on
  // either side of the line.
  {
    fg: 'border-strong',
    bg: 'surface-sunken',
    min: NON_TEXT,
    use: 'Input resting border, against its fill',
    recorded: { light: 1.44, dark: 1.94 },
    reason: 'the visible label and the sunken fill identify the field (non-text)',
  },
  {
    fg: 'border-strong',
    bg: 'surface-page',
    min: NON_TEXT,
    use: 'Input resting border, against the page',
    recorded: { light: 1.6, dark: 1.83 },
    reason: 'the visible label and the sunken fill identify the field (non-text)',
  },
];

describe.each<Theme>(['light', 'dark'])('%s theme contrast', (theme) => {
  it.each(PAIRS)('$fg on $bg ($use) meets $min:1', ({ fg, bg, min }) => {
    const ratio = contrastRatio(color(fg, theme), color(bg, theme));
    expect(ratio, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(min);
  });

  it.each(EXCEPTIONS)(
    '$fg on $bg ($use) is an accepted exception and no worse than recorded',
    ({ fg, bg, min, recorded }) => {
      const ratio = contrastRatio(color(fg, theme), color(bg, theme));
      expect(ratio, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        recorded[theme],
      );
      // If it now passes, drop the exception so the pair is held to the minimum.
      expect(ratio).toBeLessThan(min);
    },
  );
});

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    const black = '#000000';
    const white = '#ffffff';
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, white)).toBe(1);
    expect(contrastRatio(white, black)).toBe(contrastRatio(black, white));
  });
});
