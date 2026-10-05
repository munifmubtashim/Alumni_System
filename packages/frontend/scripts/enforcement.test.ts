// @vitest-environment node
// Proves the tokens-only and import-boundary lint rules actually fire.
// Fixtures are linted in memory; nothing is written under src/.
import path from 'node:path';
import { ESLint, type Linter } from 'eslint';
import stylelint from 'stylelint';
import tseslint from 'typescript-eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const frontendRoot = path.resolve(import.meta.dirname, '..');
const fixtureDir = 'src/components/ui/__fixture__';

// Loading ESLint, its plugins and Stylelint cold takes seconds, more when the
// full suite's jsdom workers compete for CPU. Do it once here with a generous
// timeout so each test keeps the default per-test timeout.
const SETUP_TIMEOUT_MS = 60_000;

let eslint: ESLint;

beforeAll(async () => {
  // Type-aware linting needs the file on disk; the enforcement rules are purely
  // syntactic, so turn type information off for in-memory fixtures.
  eslint = new ESLint({
    cwd: frontendRoot,
    overrideConfig: {
      languageOptions: { parserOptions: { projectService: false, project: null } },
      rules: tseslint.configs.disableTypeChecked.rules,
    },
  });
  // Warm-up: resolves the config and loads every plugin before the timed tests.
  await eslint.lintText('export {};\n', { filePath: path.join(fixtureDir, 'Warmup.tsx') });
  await stylelintRules('.warmup {\n  margin: 0;\n}\n');
}, SETUP_TIMEOUT_MS);

async function eslintMessages(code: string, file = 'Bad.tsx'): Promise<Linter.LintMessage[]> {
  const [result] = await eslint.lintText(code, { filePath: path.join(fixtureDir, file) });
  if (!result) throw new Error('ESLint returned no result');
  expect(result.messages.every((m) => !m.fatal)).toBe(true);
  return result.messages;
}

function ruleIds(messages: { ruleId?: string | null; rule?: string }[]): string[] {
  return messages.map((m) => m.ruleId ?? m.rule ?? '');
}

async function stylelintRules(code: string): Promise<string[]> {
  const { results } = await stylelint.lint({
    code,
    codeFilename: path.join(frontendRoot, fixtureDir, 'Bad.module.css'),
    configFile: path.join(frontendRoot, 'stylelint.config.js'),
  });
  const [result] = results;
  if (!result) throw new Error('Stylelint returned no result');
  return ruleIds(result.warnings);
}

describe('ESLint enforcement', () => {
  it('rejects a raw hex color in a string literal', async () => {
    const messages = await eslintMessages("export const accent = '#975c43';\n");
    expect(ruleIds(messages)).toContain('no-restricted-syntax');
  });

  it('rejects an rgb() color in a template literal', async () => {
    const messages = await eslintMessages('export const ink = `rgb(0 0 0)`;\n');
    expect(ruleIds(messages)).toContain('no-restricted-syntax');
  });

  it('rejects boxShadow in a JSX style prop', async () => {
    const code = "export function Bad() {\n  return <div style={{ boxShadow: 'none' }} />;\n}\n";
    const messages = await eslintMessages(code);
    expect(ruleIds(messages)).toContain('no-restricted-syntax');
  });

  it('rejects an alias import of services from components/ui', async () => {
    const messages = await eslintMessages(
      "import { x } from '@/services/x';\nexport const y = x;\n",
    );
    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('rejects a relative import of services from components/ui', async () => {
    const messages = await eslintMessages(
      "import { x } from '../../../services/x';\nexport const y = x;\n",
    );
    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('rejects store, axios and react-query imports from components/ui', async () => {
    const code = [
      "import { a } from '@/store/themeAtom';",
      "import axios from 'axios';",
      "import { useQuery } from '@tanstack/react-query';",
      'export const all = [a, axios, useQuery];',
      '',
    ].join('\n');
    const ids = ruleIds(await eslintMessages(code));
    expect(ids.filter((id) => id === 'no-restricted-imports')).toHaveLength(3);
  });

  it('accepts a clean primitive', async () => {
    const code = [
      "import styles from './Clean.module.css';",
      '',
      'export function Clean() {',
      "  return <div className={styles.root} style={{ color: 'var(--ink-primary)' }} />;",
      '}',
      '',
    ].join('\n');
    expect(await eslintMessages(code, 'Clean.tsx')).toEqual([]);
  });
});

describe('Stylelint enforcement', () => {
  it.each([
    ['a hex color', '.box {\n  color: #fff;\n}\n', 'color-no-hex'],
    ['an rgb() color', '.box {\n  color: rgb(0 0 0);\n}\n', 'function-disallowed-list'],
    ['a named color', '.box {\n  color: red;\n}\n', 'color-named'],
    ['box-shadow', '.box {\n  box-shadow: none;\n}\n', 'property-disallowed-list'],
    ['raw padding', '.box {\n  padding: 12px;\n}\n', 'scale-unlimited/declaration-strict-value'],
    [
      'raw font-size',
      '.box {\n  font-size: 14px;\n}\n',
      'scale-unlimited/declaration-strict-value',
    ],
  ])('rejects %s', async (_label, code, rule) => {
    expect(await stylelintRules(code)).toContain(rule);
  });

  it('accepts token-only CSS', async () => {
    const code = [
      '.cardRoot {',
      '  padding: var(--space-3);',
      '  margin: 0;',
      '  border: 1px solid var(--border-subtle);',
      '  border-radius: var(--radius-lg);',
      '  color: currentcolor;',
      '  background: transparent;',
      '  width: 100%;',
      '}',
      '',
    ].join('\n');
    expect(await stylelintRules(code)).toEqual([]);
  });
});
