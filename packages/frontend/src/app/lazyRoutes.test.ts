// Guard for ADR-08: the directory page must stay in its own chunk. A single
// static import of `features/directory` from anywhere else in `src/` would pull
// the page into the entry chunk, while the build still succeeds.
import type { RouteObject } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DIRECTORY_ROUTE, routes } from './router';

// Vite reads every source file as text at test time (src/ tests have no Node
// types, so no `fs`). The directory feature itself and test files are left out.
const SOURCES = import.meta.glob<string>(
  ['/src/**/*.{ts,tsx}', '!/src/features/directory/**', '!/src/**/*.test.{ts,tsx}'],
  { query: '?raw', import: 'default', eager: true },
);

const LAZY_FEATURE = '/src/features/directory';

// `import x from '…'`, `import '…'`, `export … from '…'` (types included).
// `import('…')` has a parenthesis after `import`, so dynamic imports never match.
const STATIC_IMPORT = /^\s*(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/gm;

/** Folds `.` and `..` segments out of an absolute `/src/...` path. */
function normalize(path: string): string {
  const parts: string[] = [];
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

/** Turns an import specifier into a `/src/...` path, or null for packages. */
function resolveSpecifier(specifier: string, fromFile: string): string | null {
  if (specifier.startsWith('@/')) return normalize(`/src/${specifier.slice(2)}`);
  if (specifier.startsWith('.')) {
    const dir = fromFile.slice(0, fromFile.lastIndexOf('/'));
    return normalize(`${dir}/${specifier}`);
  }
  return null;
}

/** Static imports in `source` (a file at `file`) that reach the lazy feature. */
function staticImportsOfLazyFeature(source: string, file: string): string[] {
  return [...source.matchAll(STATIC_IMPORT)]
    .map((match) => match[1] ?? '')
    .filter((specifier) => {
      const resolved = resolveSpecifier(specifier, file);
      return (
        resolved !== null && (resolved === LAZY_FEATURE || resolved.startsWith(`${LAZY_FEATURE}/`))
      );
    });
}

function findRoute(tree: RouteObject[], path: string): RouteObject | undefined {
  for (const route of tree) {
    if (route.path === path) return route;
    const found = route.children && findRoute(route.children, path);
    if (found) return found;
  }
  return undefined;
}

describe('lazy directory route (ADR-08)', () => {
  it('reads the source tree, with the directory feature and tests left out', () => {
    const files = Object.keys(SOURCES);

    expect(files).toContain('/src/app/router.tsx');
    expect(files).toContain('/src/main.tsx');
    expect(files.some((file) => file.startsWith(`${LAZY_FEATURE}/`))).toBe(false);
    expect(files.some((file) => file.includes('.test.'))).toBe(false);
  });

  it('has no static import of features/directory anywhere else in src/', () => {
    const offenders = Object.entries(SOURCES).flatMap(([file, source]) =>
      staticImportsOfLazyFeature(source, file).map((specifier) => `${file}: ${specifier}`),
    );

    expect(offenders).toEqual([]);
  });

  it('still references the page through the dynamic import in router.tsx', () => {
    expect(SOURCES['/src/app/router.tsx']).toContain(
      "import('@/features/directory/DirectoryPage')",
    );
  });

  it.each([
    ["import { DirectoryPage } from '@/features/directory/DirectoryPage';", '/src/app/x.tsx'],
    ["import type { DirectoryParams } from '@/features/directory/params';", '/src/app/x.ts'],
    ["export * from '@/features/directory';", '/src/features/index.ts'],
    ["import '@/features/directory/DirectoryPage.module.css';", '/src/app/x.ts'],
    [
      "import {\n  DirectoryPage,\n} from '../directory/DirectoryPage';",
      '/src/features/home/x.tsx',
    ],
    ["import { x } from './features/directory/params';", '/src/main.tsx'],
  ])('flags the static import in %j', (source, file) => {
    expect(staticImportsOfLazyFeature(source, file)).toHaveLength(1);
  });

  it.each([
    ["const page = import('@/features/directory/DirectoryPage');", '/src/app/x.tsx'],
    ["import { HomePage } from '@/features/home';", '/src/app/x.tsx'],
    ["import { x } from '@/features/directoryHelpers';", '/src/app/x.tsx'],
    ["import { x } from '../directoryHelpers';", '/src/features/home/x.tsx'],
    ["import { Link } from 'react-router';", '/src/app/x.tsx'],
  ])('lets %j through', (source, file) => {
    expect(staticImportsOfLazyFeature(source, file)).toEqual([]);
  });

  it('puts the lazy directory route, with its own HydrateFallback, in the route tree', () => {
    const route = findRoute(routes, 'directory');

    expect(route).toBe(DIRECTORY_ROUTE);
    expect(typeof route?.lazy).toBe('function');
    expect(route?.HydrateFallback).toBeDefined();
    expect(route?.Component).toBeUndefined();
    expect(route?.element).toBeUndefined();
  });
});
