// Guard for ADR-08: each lazy page must stay in its own chunk. A single static
// import of a lazy feature from anywhere else in `src/` (another lazy feature
// included) would pull that page into the importer's chunk, while the build
// still succeeds.
import type { RouteObject } from 'react-router';
import { describe, expect, it } from 'vitest';
import {
  ABOUT_ROUTE,
  ADMIN_ROUTE,
  DIRECTORY_ROUTE,
  FEED_ROUTE,
  ME_ROUTE,
  PROFILE_ROUTE,
  routes,
} from './router';

// Vite reads every source file as text at test time (src/ tests have no Node
// types, so no `fs`). Test files are left out; the lazy features themselves are
// read too, because one lazy feature may not import another statically.
const SOURCES = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** One entry per lazy feature: its folder, route and the router's import(). */
const LAZY_FEATURES = [
  {
    name: 'directory',
    route: DIRECTORY_ROUTE,
    path: 'directory',
    dynamicImport: "import('@/features/directory/DirectoryPage')",
  },
  {
    name: 'profile',
    route: PROFILE_ROUTE,
    path: 'alumni/:id',
    dynamicImport: "import('@/features/profile/ProfilePage')",
  },
  {
    name: 'feed',
    route: FEED_ROUTE,
    path: 'feed',
    dynamicImport: "import('@/features/feed/FeedPage')",
  },
  {
    name: 'me',
    route: ME_ROUTE,
    path: 'me',
    dynamicImport: "import('@/features/me/MePage')",
  },
  {
    name: 'about',
    route: ABOUT_ROUTE,
    path: 'about',
    dynamicImport: "import('@/features/about/AboutPage')",
  },
  {
    name: 'admin',
    route: ADMIN_ROUTE,
    path: 'admin',
    dynamicImport: "import('@/features/admin/AdminPage')",
  },
] as const;

type LazyFeature = (typeof LAZY_FEATURES)[number]['name'];

const featureDir = (feature: LazyFeature) => `/src/features/${feature}`;

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

const isInside = (path: string, dir: string) => path === dir || path.startsWith(`${dir}/`);

/**
 * Static imports in `source` (a file at `file`) that reach `feature`. One
 * check per feature: only that feature's own folder may import it statically.
 */
function staticImportsOf(feature: LazyFeature, source: string, file: string): string[] {
  const dir = featureDir(feature);
  if (isInside(file, dir)) return [];
  return [...source.matchAll(STATIC_IMPORT)]
    .map((match) => match[1] ?? '')
    .filter((specifier) => {
      const resolved = resolveSpecifier(specifier, file);
      return resolved !== null && isInside(resolved, dir);
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

it('reads the source tree, lazy features included and tests left out', () => {
  const files = Object.keys(SOURCES);

  expect(files).toContain('/src/app/router.tsx');
  expect(files).toContain('/src/main.tsx');
  for (const { name } of LAZY_FEATURES) {
    expect(files.some((file) => file.startsWith(`${featureDir(name)}/`))).toBe(true);
  }
  expect(files.some((file) => file.includes('.test.'))).toBe(false);
});

describe.each(LAZY_FEATURES)(
  'lazy $name route (ADR-08)',
  ({ name, route, path, dynamicImport }) => {
    it(`has no static import of features/${name} outside its own folder`, () => {
      const offenders = Object.entries(SOURCES).flatMap(([file, source]) =>
        staticImportsOf(name, source, file).map((specifier) => `${file}: ${specifier}`),
      );

      expect(offenders).toEqual([]);
    });

    it('still references the page through the dynamic import in router.tsx', () => {
      expect(SOURCES['/src/app/router.tsx']).toContain(dynamicImport);
    });

    it('puts the lazy route, with its own HydrateFallback, in the route tree', () => {
      const found = findRoute(routes, path);

      expect(found).toBe(route);
      expect(typeof found?.lazy).toBe('function');
      expect(found?.HydrateFallback).toBeDefined();
      expect(found?.Component).toBeUndefined();
      expect(found?.element).toBeUndefined();
    });
  },
);

describe('the static-import check', () => {
  it.each<[LazyFeature, string, string]>([
    [
      'directory',
      "import { DirectoryPage } from '@/features/directory/DirectoryPage';",
      '/src/app/x.tsx',
    ],
    [
      'directory',
      "import type { DirectoryParams } from '@/features/directory/params';",
      '/src/app/x.ts',
    ],
    ['directory', "export * from '@/features/directory';", '/src/features/index.ts'],
    ['directory', "import '@/features/directory/DirectoryPage.module.css';", '/src/app/x.ts'],
    [
      'directory',
      "import {\n  DirectoryPage,\n} from '../directory/DirectoryPage';",
      '/src/features/home/x.tsx',
    ],
    ['directory', "import { x } from './features/directory/params';", '/src/main.tsx'],
    ['profile', "import { ProfilePage } from '@/features/profile/ProfilePage';", '/src/app/x.tsx'],
    ['profile', "import { x } from '../../features/profile';", '/src/app/AppShell/x.tsx'],
    // One lazy feature may not pull in the other (ADV-006).
    [
      'directory',
      "import { parseParams } from '../directory/params';",
      '/src/features/profile/x.tsx',
    ],
    [
      'directory',
      "import { x } from '@/features/directory/params';",
      '/src/features/profile/x.tsx',
    ],
    ['profile', "import { BackLink } from '../profile/BackLink';", '/src/features/directory/x.tsx'],
    ['profile', "import { x } from '@/features/profile/format';", '/src/features/directory/x.tsx'],
    ['feed', "import { FeedPage } from '@/features/feed/FeedPage';", '/src/app/x.tsx'],
    ['feed', "import { x } from '../feed/feedFormat';", '/src/features/home/x.tsx'],
    ['feed', "import { PostCard } from '../feed/PostCard';", '/src/features/profile/x.tsx'],
    ['profile', "import { x } from '@/features/profile/format';", '/src/features/feed/x.tsx'],
    ['directory', "import { x } from '../directory/params';", '/src/features/feed/x.tsx'],
    ['me', "import { MePage } from '@/features/me/MePage';", '/src/app/x.tsx'],
    ['me', "import { x } from '../me/validation';", '/src/features/home/x.tsx'],
    ['me', "import { x } from '../../features/me';", '/src/app/AppShell/x.tsx'],
    ['feed', "import { x } from '../feed/feedFormat';", '/src/features/me/x.tsx'],
    ['me', "import { x } from '@/features/me/fields';", '/src/features/profile/x.tsx'],
    ['about', "import { AboutPage } from '@/features/about/AboutPage';", '/src/app/x.tsx'],
    ['about', "import { x } from '../about/AboutPage';", '/src/features/auth/x.tsx'],
    ['feed', "import { x } from '../feed/feedFormat';", '/src/features/about/x.tsx'],
    ['admin', "import { AdminPage } from '@/features/admin/AdminPage';", '/src/app/x.tsx'],
    ['admin', "import { x } from '../../features/admin/params';", '/src/app/AppShell/x.tsx'],
    ['admin', "import { x } from '../admin/params';", '/src/features/directory/x.tsx'],
    ['directory', "import { x } from '../directory/params';", '/src/features/admin/x.tsx'],
  ])('flags, for features/%s, the static import in %j', (feature, source, file) => {
    expect(staticImportsOf(feature, source, file)).toHaveLength(1);
  });

  it.each<[LazyFeature, string, string]>([
    ['directory', "const page = import('@/features/directory/DirectoryPage');", '/src/app/x.tsx'],
    ['directory', "import { HomePage } from '@/features/home';", '/src/app/x.tsx'],
    ['directory', "import { x } from '@/features/directoryHelpers';", '/src/app/x.tsx'],
    ['directory', "import { x } from '../directoryHelpers';", '/src/features/home/x.tsx'],
    ['directory', "import { Link } from 'react-router';", '/src/app/x.tsx'],
    ['directory', "import { x } from './params';", '/src/features/directory/x.tsx'],
    ['profile', "const page = import('@/features/profile/ProfilePage');", '/src/app/x.tsx'],
    ['profile', "import { x } from '@/features/profileHelpers';", '/src/app/x.tsx'],
    ['profile', "import { format } from './format';", '/src/features/profile/x.tsx'],
    ['profile', "import { x } from '@/features/profile/format';", '/src/features/profile/x.tsx'],
    ['feed', "const page = import('@/features/feed/FeedPage');", '/src/app/x.tsx'],
    ['feed', "import { x } from '@/features/feedHelpers';", '/src/app/x.tsx'],
    ['feed', "import { PostCard } from './PostCard';", '/src/features/feed/x.tsx'],
    ['me', "const page = import('@/features/me/MePage');", '/src/app/x.tsx'],
    ['me', "import { x } from '@/features/media';", '/src/app/x.tsx'],
    ['me', "import { x } from '../meHelpers';", '/src/features/home/x.tsx'],
    ['me', "import { SaveBar } from './SaveBar';", '/src/features/me/x.tsx'],
    ['admin', "const page = import('@/features/admin/AdminPage');", '/src/app/x.tsx'],
    ['admin', "import { x } from '@/features/administration';", '/src/app/x.tsx'],
    ['admin', "import { x } from './params';", '/src/features/admin/x.tsx'],
  ])('lets, for features/%s, %j through', (feature, source, file) => {
    expect(staticImportsOf(feature, source, file)).toEqual([]);
  });
});
