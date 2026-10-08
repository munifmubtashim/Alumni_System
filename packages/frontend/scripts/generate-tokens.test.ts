// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
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
    expect(tokens.color.tokens).toHaveLength(19);
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

  it('emits each motion token once, durations in ms', () => {
    const motion = tokens.motion.tokens.map((t) => t.name);
    expect(motion).toContain('duration-fast');
    for (const name of motion) {
      expect(countDeclarations(rendered, name), name).toBe(1);
    }
    expect(rendered).toContain('--duration-fast: 150ms;');
    expect(rendered).toContain('--easing-standard: ease;');
  });

  it('rejects a duration that is not ms', () => {
    const bad: TokensJson = {
      ...tokens,
      motion: { tokens: [{ name: 'duration-fast', value: '0.15s' }] },
    };
    expect(() => renderTokensCss(bad)).toThrow(/expected a ms value/);
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

describe('generate-tokens CLI', () => {
  const scriptPath = path.resolve(import.meta.dirname, 'generate-tokens.ts');
  const tokensJsonPath = path.resolve(
    import.meta.dirname,
    '../../../docs/design/design-system/tokens.json',
  );
  const tempDirs: string[] = [];

  function tempDir(): string {
    const dir = mkdtempSync(path.join(tmpdir(), 'generate-tokens-'));
    tempDirs.push(dir);
    return dir;
  }

  /** Runs `node <symlink to script> --check` from a fresh temp dir. */
  function checkViaSymlink(target: string) {
    const link = path.join(tempDir(), 'generate-tokens.ts');
    symlinkSync(target, link);
    return spawnSync(process.execPath, [link, '--check'], { encoding: 'utf8' });
  }

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('runs the check when started through a symlink', () => {
    const result = checkViaSymlink(scriptPath);
    expect(result.stdout).toContain('tokens.css is up to date');
    expect(result.status).toBe(0);
  });

  it('exits 1 through a symlink when tokens.css is stale', () => {
    // A copy of the repo layout in a temp dir, so the real tokens.css is never touched.
    const root = tempDir();
    const frontend = path.join(root, 'packages/frontend');
    const designDir = path.join(root, 'docs/design/design-system');
    mkdirSync(path.join(frontend, 'scripts'), { recursive: true });
    mkdirSync(path.join(frontend, 'src/styles'), { recursive: true });
    mkdirSync(designDir, { recursive: true });
    writeFileSync(path.join(frontend, 'package.json'), '{ "type": "module" }\n');
    copyFileSync(scriptPath, path.join(frontend, 'scripts/generate-tokens.ts'));
    copyFileSync(tokensJsonPath, path.join(designDir, 'tokens.json'));
    writeFileSync(path.join(frontend, 'src/styles/tokens.css'), ':root {}\n');

    const result = checkViaSymlink(path.join(frontend, 'scripts/generate-tokens.ts'));
    expect(result.stderr).toContain('tokens.css is stale');
    expect(result.status).toBe(1);
  });
});
