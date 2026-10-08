// Turns docs/design/design-system/tokens.json into src/styles/tokens.css.
//
//   node scripts/generate-tokens.ts           write tokens.css   (npm run tokens)
//   node scripts/generate-tokens.ts --check   exit 1 if stale     (npm run tokens:check)
//
// renderTokensCss() is pure; scripts/generate-tokens.test.ts calls it and
// readTokensCss() to check the committed file.

import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ColorToken {
  name: string;
  value: Record<string, string>;
}

export interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
}

export interface TokensJson {
  color: { themes: { id: string }[]; tokens: ColorToken[] };
  type: {
    families: Record<string, string>;
    groups: { family: string; styles: TypeStyle[] }[];
  };
  spacing: { tokens: { name: string; value: string }[] };
  radius: { tokens: { name: string; value: string }[] };
  motion: { tokens: { name: string; value: string }[] };
}

const HEADER = [
  '/* Generated from docs/design/design-system/tokens.json by scripts/generate-tokens.ts — do not edit. */',
  '/* Change tokens.json, then run `npm run tokens`. */',
];

// @fontsource-variable/inter registers the face as 'Inter Variable', not
// 'Inter'. tokens.json names the design font ('Inter'); the generated stack puts
// the self-hosted variable face first and keeps 'Inter' as a fallback for a
// locally installed copy.
const FONTSOURCE_FAMILY_NAMES: Record<string, string> = {
  "'Inter'": "'Inter Variable'",
};

const ROOT_FONT_SIZE_PX = 16;

function parsePx(value: string, where: string): number {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value);
  if (!match?.[1]) {
    throw new Error(`${where}: expected a px value, got "${value}"`);
  }
  return Number(match[1]);
}

function checkMotion(name: string, value: string): string {
  // Durations must be ms (one unit everywhere); anything else is a timing function.
  if (name.startsWith('duration-') && !/^\d+ms$/.test(value)) {
    throw new Error(`${name}: expected a ms value, got "${value}"`);
  }
  return value;
}

/** px → rem, so spacing and text follow the user's browser font-size setting. */
function pxToRem(value: string, where: string): string {
  const rem = parsePx(value, where) / ROOT_FONT_SIZE_PX;
  return rem === 0 ? '0' : `${String(rem)}rem`;
}

function fontStack(family: string): string {
  return family
    .split(',')
    .map((name) => name.trim())
    .flatMap((name) => {
      const variableName = FONTSOURCE_FAMILY_NAMES[name];
      return variableName ? [variableName, name] : [name];
    })
    .join(', ');
}

function block(selector: string, lines: string[]): string {
  return `${selector} {\n${lines.map((line) => `  ${line}`).join('\n')}\n}`;
}

export function renderTokensCss(tokens: TokensJson): string {
  const rootLines: string[] = [];

  for (const { name, value } of tokens.spacing.tokens) {
    rootLines.push(`--${name}: ${pxToRem(value, name)};`);
  }
  for (const { name, value } of tokens.radius.tokens) {
    parsePx(value, name);
    rootLines.push(`--${name}: ${value};`);
  }
  for (const { name, value } of tokens.motion.tokens) {
    rootLines.push(`--${name}: ${checkMotion(name, value)};`);
  }
  for (const [key, family] of Object.entries(tokens.type.families)) {
    rootLines.push(`--font-${key}: ${fontStack(family)};`);
  }
  for (const group of tokens.type.groups) {
    if (!(group.family in tokens.type.families)) {
      throw new Error(`type group uses unknown family "${group.family}"`);
    }
    for (const style of group.styles) {
      const size = pxToRem(style.fontSize, `${style.name}.fontSize`);
      const line = pxToRem(style.lineHeight, `${style.name}.lineHeight`);
      const weight = String(style.fontWeight);
      rootLines.push(
        `--text-${style.name}: ${weight} ${size}/${line} var(--font-${group.family});`,
        `--text-${style.name}-size: ${size};`,
        `--text-${style.name}-line: ${line};`,
        `--text-${style.name}-weight: ${weight};`,
      );
    }
  }

  const themeBlocks = tokens.color.themes.map(({ id }, index) => {
    const selector = `:root[data-theme='${id}']`;
    // The first theme (light) is also the default when no data-theme is set.
    const selectors = index === 0 ? `:root,\n${selector}` : selector;
    const lines = [`color-scheme: ${id};`];
    for (const token of tokens.color.tokens) {
      const value = token.value[id];
      if (!value) {
        throw new Error(`color token "${token.name}" has no value for theme "${id}"`);
      }
      lines.push(`--${token.name}: ${value};`);
    }
    return block(selectors, lines);
  });

  return `${[HEADER.join('\n'), block(':root', rootLines), ...themeBlocks].join('\n\n')}\n`;
}

const TOKENS_JSON_PATH = path.resolve(
  import.meta.dirname,
  '../../../docs/design/design-system/tokens.json',
);
const TOKENS_CSS_PATH = path.resolve(import.meta.dirname, '../src/styles/tokens.css');

/**
 * The committed tokens.css as it is on disk ('' if missing). Exported for the
 * test: Vitest stubs CSS imports (even `?raw`) to an empty string.
 */
export function readTokensCss(): string {
  return existsSync(TOKENS_CSS_PATH) ? readFileSync(TOKENS_CSS_PATH, 'utf8') : '';
}

function runCli(argv: string[]): number {
  const css = renderTokensCss(JSON.parse(readFileSync(TOKENS_JSON_PATH, 'utf8')) as TokensJson);

  if (argv.includes('--check')) {
    if (readTokensCss() !== css) {
      console.error('src/styles/tokens.css is stale — run npm run tokens');
      return 1;
    }
    console.log('src/styles/tokens.css is up to date');
    return 0;
  }

  writeFileSync(TOKENS_CSS_PATH, css);
  console.log('Wrote src/styles/tokens.css');
  return 0;
}

// Run the CLI only when Node executes this file directly, not when a test imports it.
// Compare real paths: Node resolves symlinks for import.meta.url but not for
// argv[1], so a symlinked checkout would otherwise skip the CLI and exit 0.
function isCliEntry(): boolean {
  const entry = process.argv[1];
  if (!entry || !existsSync(entry)) return false;
  return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
}

if (isCliEntry()) {
  process.exitCode = runCli(process.argv);
}
