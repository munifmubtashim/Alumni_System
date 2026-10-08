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

async function eslintMessages(
  code: string,
  file = 'Bad.tsx',
  dir = fixtureDir,
): Promise<Linter.LintMessage[]> {
  const [result] = await eslint.lintText(code, { filePath: path.join(dir, file) });
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

  it('rejects a 4-digit hex word such as #feed in a plain string (it is a valid color)', async () => {
    const messages = await eslintMessages("export const tag = '#feed';\n");
    expect(ruleIds(messages)).toContain('no-restricted-syntax');
  });

  it.each([
    ['an in-page href anchor', 'export const A = () => <a href="#feed">Feed</a>;\n'],
    ['a hex-looking word that runs on with a dash', "export const id = '#feed-list';\n"],
    ['a 5-letter hex-looking word (not a valid color length)', "export const id = '#faded';\n"],
  ])('does not flag %s as a raw color', async (_label, code) => {
    expect(ruleIds(await eslintMessages(code))).not.toContain('no-restricted-syntax');
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

// Each layer's banned imports, in alias and relative (incl. bare-folder) form.
// Fixture files sit one level below the layer folder: src/<layer>/__fixture__/.
const BOUNDARY_CASES: [layerDir: string, banned: string[]][] = [
  ['features', ['@/app/providers', '../../app/providers', '../../app']],
  [
    'store',
    [
      '@/app/queryClient',
      '../../app',
      '@/services/x',
      '../../services',
      '@/features/x',
      '../../features/x',
    ],
  ],
  [
    'services',
    [
      '@/app/x',
      '../../app',
      '@/store/themeAtom',
      '../../store',
      '@/features/x',
      '../../features',
      '@/components/ui/Button',
      '../../components',
    ],
  ],
  ['components', ['@/app/x', '../../app']],
  ['components/ui', ['@/config/brand', '../../../config/brand', '../../../config', './config']],
  [
    'config',
    [
      '@/app/x',
      '../../app',
      '@/features/auth',
      '../../features/auth',
      '@/components/ui/Logo',
      '../../components',
      '@/store/themeAtom',
      '../../store',
      '@/services/x',
      '../../services/x',
    ],
  ],
];

describe('ESLint layer boundaries', () => {
  it.each(
    BOUNDARY_CASES.flatMap(([layer, banned]) => banned.map((spec) => [layer, spec] as const)),
  )('rejects src/%s importing %s', async (layer, spec) => {
    const code = `import { x } from '${spec}';\nexport const y = x;\n`;
    const messages = await eslintMessages(code, 'Bad.ts', `src/${layer}/__fixture__`);
    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it('rejects a react import from services', async () => {
    const code = "import { useState } from 'react';\nexport const y = useState;\n";
    const messages = await eslintMessages(code, 'Bad.ts', 'src/services/__fixture__');
    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });

  it.each([
    ['features', "import { a } from '@/store/themeAtom';\nimport { s } from '@/services/x';"],
    ['services', "import { t } from './authToken';"],
    ['store', "import { atom } from 'jotai';"],
    ['components', "import { Button } from '@/components/ui/Button';"],
    ['config', "import { x } from './other';"],
    ['features', "import { BRAND_NAME } from '@/config/brand';"],
    ['app', "import { BRAND_NAME } from '@/config/brand';\nimport { x } from '../../config';"],
  ])('allows the permitted imports in src/%s', async (layer, imports) => {
    const code = `${imports}\nexport {};\n`;
    const messages = await eslintMessages(code, 'Ok.ts', `src/${layer}/__fixture__`);
    expect(ruleIds(messages)).not.toContain('no-restricted-imports');
  });
});

describe('ESLint layer boundaries: package sub-paths and tests', () => {
  it.each([
    ['features', 'firebase/app'],
    ['features', 'some-lib/services'],
    ['components/ui', 'firebase/app'],
    ['components/ui', 'some-lib/services'],
    ['store', 'some-lib/features'],
    ['services', 'some-lib/components'],
    ['config', 'some-lib/app'],
    ['components/ui', 'some-lib/config'],
  ])('allows src/%s importing the package sub-path %s', async (layer, spec) => {
    const code = `import { x } from '${spec}';\nexport const y = x;\n`;
    const messages = await eslintMessages(code, 'Ok.ts', `src/${layer}/__fixture__`);
    expect(ruleIds(messages)).not.toContain('no-restricted-imports');
  });

  it.each(['features', 'components', 'components/ui', 'store', 'services'])(
    'allows a test file in src/%s to import @/app/providers',
    async (layer) => {
      const code = "import { x } from '@/app/providers';\nexport const y = x;\n";
      const messages = await eslintMessages(code, 'Ok.test.tsx', `src/${layer}/__fixture__`);
      expect(ruleIds(messages)).not.toContain('no-restricted-imports');
    },
  );

  it.each(['@/app/x', '../../app/x'])(
    'still rejects a feature source file importing %s',
    async (spec) => {
      const code = `import { x } from '${spec}';\nexport const y = x;\n`;
      const messages = await eslintMessages(code, 'Bad.ts', 'src/features/__fixture__');
      expect(ruleIds(messages)).toContain('no-restricted-imports');
    },
  );

  it.each([
    ['components/ui', "import axios from 'axios';"],
    ['components/ui', "import { s } from '@/services/x';"],
    ['services', "import { useState } from 'react';"],
    ['store', "import { s } from '../../services/x';"],
  ])('keeps the other bans for test files in src/%s (%s)', async (layer, imports) => {
    const code = `${imports}\nexport {};\n`;
    const messages = await eslintMessages(code, 'Bad.test.tsx', `src/${layer}/__fixture__`);
    expect(ruleIds(messages)).toContain('no-restricted-imports');
  });
});

// ADR-08: each lazy feature (directory, profile, feed, me, about, admin) is reached only through the
// router's lazy import(). This ban is the typescript-eslint copy of the rule,
// so it has its own rule id.
describe('ESLint lazy-feature boundary (features/directory, profile, feed, me, about, admin)', () => {
  const LAZY_RULE = '@typescript-eslint/no-restricted-imports';

  it.each([
    ['src/app/__fixture__', "import { DirectoryPage } from '@/features/directory/DirectoryPage';"],
    ['src/app/__fixture__', "import { x } from '../../features/directory/params';"],
    ['src/app/__fixture__', "import '@/features/directory/DirectoryPage.module.css';"],
    ['src/app/__fixture__', "export * from '@/features/directory';"],
    ['src', "import { x } from './features/directory/params';"],
    ['src/features/home', "import { x } from '../directory/params';"],
    ['src/features/home/__fixture__', "import { x } from '../../directory';"],
    ['src/components/ui/__fixture__', "import { x } from '@/features/directory/params';"],
    ['src/app/__fixture__', "import { ProfilePage } from '@/features/profile/ProfilePage';"],
    ['src/app/__fixture__', "import { x } from '../../features/profile';"],
    ['src/features/home', "import { x } from '../profile/format';"],
    // One lazy feature may not import the other statically (ADV-006).
    ['src/features/profile', "import { x } from '../directory/params';"],
    ['src/features/profile', "import { x } from '@/features/directory/params';"],
    ['src/features/profile/__fixture__', "import { x } from '../../directory';"],
    ['src/features/directory', "import { x } from '../profile/format';"],
    ['src/features/directory', "import { x } from '@/features/profile/ProfilePage';"],
    ['src/features/directory/__fixture__', "import { x } from '../../profile';"],
    ['src/app/__fixture__', "import { FeedPage } from '@/features/feed/FeedPage';"],
    ['src/features/home', "import { x } from '../feed/feedFormat';"],
    ['src/features/profile', "import { PostCard } from '../feed/PostCard';"],
    ['src/features/feed', "import { x } from '../profile/format';"],
    ['src/features/feed/__fixture__', "import { x } from '../../directory';"],
    ['src/app/__fixture__', "import { MePage } from '@/features/me/MePage';"],
    ['src/app/__fixture__', "import { x } from '../../features/me';"],
    ['src/features/home', "import { x } from '../me/validation';"],
    ['src/features/profile', "import { x } from '@/features/me/fields';"],
    ['src/features/me', "import { x } from '../feed/feedFormat';"],
    ['src/features/me/__fixture__', "import { x } from '../../profile';"],
    ['src/app/__fixture__', "import { AboutPage } from '@/features/about/AboutPage';"],
    ['src/app/__fixture__', "import { x } from '../../features/about';"],
    ['src/features/auth', "import { x } from '../about/AboutPage';"],
    ['src/features/about', "import { x } from '../feed/feedFormat';"],
    ['src/features/about/__fixture__', "import { x } from '../../me';"],
    ['src/features/feed', "import { x } from '@/features/about/AboutPage';"],
    ['src/app/__fixture__', "import { AdminPage } from '@/features/admin/AdminPage';"],
    ['src/app/__fixture__', "import { x } from '../../features/admin';"],
    ['src/features/home', "import { x } from '../admin/params';"],
    ['src/features/admin', "import { x } from '../directory/params';"],
    ['src/features/admin/__fixture__', "import { x } from '../../me';"],
    ['src/features/directory', "import { x } from '@/features/admin/params';"],
  ])('rejects a static import in %s: %s', async (dir, imports) => {
    const messages = await eslintMessages(`${imports}\nexport {};\n`, 'Bad.ts', dir);
    expect(ruleIds(messages)).toContain(LAZY_RULE);
  });

  it.each([
    [
      'src/app/__fixture__',
      "export const page = () => import('@/features/directory/DirectoryPage');",
    ],
    ['src/app/__fixture__', "import type { DirectoryParams } from '@/features/directory/params';"],
    ['src/app/__fixture__', "import { x } from '@/features/directoryHelpers';"],
    ['src/features/directory', "import { x } from './params';"],
    ['src/features/directory', "import { x } from '@/features/directory/params';"],
    ['src/features/profile', "import { x } from './format';"],
    ['src/features/profile', "import { x } from '@/features/profile/format';"],
    ['src/app/__fixture__', "export const page = () => import('@/features/profile/ProfilePage');"],
    ['src/features/profile', "import type { DirectoryParams } from '../directory/params';"],
    ['src/features/feed', "import { PostCard } from './PostCard';"],
    ['src/app/__fixture__', "export const page = () => import('@/features/feed/FeedPage');"],
    ['src/features/me', "import { SaveBar } from './SaveBar';"],
    ['src/features/me', "import { useCurrentUser } from '@/features/auth';"],
    ['src/app/__fixture__', "import { x } from '@/features/media';"],
    ['src/app/__fixture__', "export const page = () => import('@/features/me/MePage');"],
    ['src/features/about', "import { x } from './AboutPage';"],
    ['src/app/__fixture__', "export const page = () => import('@/features/about/AboutPage');"],
    ['src/features/admin', "import { x } from './params';"],
    ['src/features/admin', "import { useIsAdmin } from '@/features/auth';"],
    ['src/app/__fixture__', "export const page = () => import('@/features/admin/AdminPage');"],
  ])('allows in %s: %s', async (dir, imports) => {
    const messages = await eslintMessages(`${imports}\nexport {};\n`, 'Ok.ts', dir);
    expect(ruleIds(messages)).not.toContain(LAZY_RULE);
  });

  it('allows a test file to import the feature statically', async () => {
    const code = "import { x } from '@/features/directory/params';\nexport const y = x;\n";
    const messages = await eslintMessages(code, 'Ok.test.tsx', 'src/app/__fixture__');
    expect(ruleIds(messages)).not.toContain(LAZY_RULE);
  });

  it('keeps the layer bans in force alongside it', async () => {
    const code = "import { x } from '@/features/directory/params';\nexport const y = x;\n";
    const ids = ruleIds(await eslintMessages(code, 'Bad.ts', 'src/components/ui/__fixture__'));
    expect(ids).toEqual(expect.arrayContaining(['no-restricted-imports', LAZY_RULE]));
  });
});

describe('Stylelint enforcement', () => {
  it.each([
    ['a hex color', '.box {\n  color: #fff;\n}\n', 'color-no-hex'],
    ['an rgb() color', '.box {\n  color: rgb(0 0 0);\n}\n', 'function-disallowed-list'],
    ['a named color', '.box {\n  color: red;\n}\n', 'color-named'],
    ['box-shadow', '.box {\n  box-shadow: none;\n}\n', 'property-disallowed-list'],
    ['raw padding', '.box {\n  padding: 12px;\n}\n', 'scale-unlimited/declaration-strict-value'],
    ['raw margin', '.box {\n  margin-top: 8px;\n}\n', 'scale-unlimited/declaration-strict-value'],
    ['raw gap', '.box {\n  gap: 8px;\n}\n', 'scale-unlimited/declaration-strict-value'],
    ['a non-camelCase class name', '.Bad_Name {\n  margin: 0;\n}\n', 'selector-class-pattern'],
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
