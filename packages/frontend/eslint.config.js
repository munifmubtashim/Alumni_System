import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

// Raw colors are only allowed in the token layer (src/styles/**).
// Only the valid CSS hex lengths (3, 4, 6, 8) count, and the match must not run
// on into a word or a dash, so '#feed-list' or '#abcde' are not flagged. A bare
// '#feed' IS a valid color and is still flagged in ordinary strings; it is
// allowed only as a JSX href/to value, where it can only be an in-page anchor.
const RAW_COLOR = '/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})(?![\\w-])|\\b(rgba?|hsla?)\\(/i';
const ANCHOR_ATTR = 'JSXAttribute[name.name=/^(href|to)$/] > Literal';
const RAW_COLOR_MESSAGE = 'Use a design token (var(--…)) instead of a raw color';
const BOX_SHADOW_MESSAGE = 'Shadows are not part of the design system; do not set boxShadow';

// Import boundaries between src/ layers. ESLint flat config does not merge a
// rule's options across matching blocks (the last block wins), so each layer
// gets exactly one no-restricted-imports block for its source files and one
// for its test files, and no two of these blocks' file globs overlap.
// Each layer is banned in its alias form and its relative form (ADV-008),
// including bare-folder imports such as '../services'. Relative globs start
// with './' or '../' so package sub-paths such as 'firebase/app' never match.
function layerBan(layer, message) {
  const forms = [`@/${layer}`, `./**/${layer}`, `../**/${layer}`];
  return { group: forms.flatMap((form) => [form, `${form}/**`]), message };
}

// Nothing imports app/ except main.tsx (app/ wires features, so a feature
// importing app/ would be a cycle). Tests are exempt: rendering a component
// under test needs the app's providers.
const NO_APP = layerBan('app', 'Only src/main.tsx may import from app/.');

const TEST_FILES = ['**/*.test.{ts,tsx}'];

/**
 * The no-restricted-imports blocks for one layer: source files get every ban;
 * test files get every ban except NO_APP.
 */
function layerBoundary({ files, ignores = [], paths = [], patterns }) {
  const rule = (list) => ['error', { paths, patterns: list }];
  const testPatterns = patterns.filter((pattern) => pattern !== NO_APP);
  const blocks = [
    {
      files,
      ignores: [...ignores, ...TEST_FILES],
      rules: { 'no-restricted-imports': rule(patterns) },
    },
  ];
  if (paths.length > 0 || testPatterns.length > 0) {
    blocks.push({
      files: files.map((glob) => glob.replace('*.{ts,tsx}', '*.test.{ts,tsx}')),
      ignores,
      rules: { 'no-restricted-imports': rule(testPatterns) },
    });
  }
  return blocks;
}

// UI primitives must stay presentational: no data, state, or app wiring. They
// also take brand text as props rather than reading config/.
const UI_FORBIDDEN_LAYERS = ['services', 'store', 'features', 'config'];

// config/ is a leaf: constants that app/ and features/ share, importing nothing internal.
const CONFIG_FORBIDDEN_LAYERS = ['features', 'components', 'store', 'services'];

// ADR-08: each lazy feature reaches the app only through the router's lazy
// import(), so it stays in its own chunk. This uses the typescript-eslint copy
// of no-restricted-imports, a separate rule from the layer blocks above, so it
// can cover all of src/ without overriding them; it also lets `import type`
// through (erased at build). Dynamic import() is never matched. '../<name>' and
// '../../<name>' are the sibling forms used from inside features/.
// src/app/lazyRoutes.test.ts is the second layer of this guard.
const LAZY_FEATURES = ['directory', 'profile', 'feed', 'me'];

function lazyBan(feature) {
  return {
    group: [
      `@/features/${feature}`,
      `./**/features/${feature}`,
      `../**/features/${feature}`,
      `../${feature}`,
      `../../${feature}`,
    ].flatMap((form) => [form, `${form}/**`]),
    allowTypeImports: true,
    message: `features/${feature} is lazy-loaded (ADR-08): reach it only through the router's import().`,
  };
}

// One check per lazy feature (ADV-006): a feature's own folder is exempt from
// its own ban only, so one lazy feature can never import another statically.
// The rule's options do not merge across blocks, so each region of src/ gets
// one block with the full list of bans that apply there, and no two overlap.
function lazyFeatureBoundaries() {
  const folders = LAZY_FEATURES.map((feature) => `src/features/${feature}/**`);
  const block = (files, ignores, banned) => ({
    files,
    ignores: [...ignores, ...TEST_FILES],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: banned.map(lazyBan) }],
    },
  });
  return [
    block(['src/**/*.{ts,tsx}'], folders, LAZY_FEATURES),
    ...LAZY_FEATURES.map((feature) =>
      block(
        [`src/features/${feature}/**/*.{ts,tsx}`],
        [],
        LAZY_FEATURES.filter((other) => other !== feature),
      ),
    ),
  ];
}

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['*.config.{js,ts}', 'scripts/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/styles/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=${RAW_COLOR}]:not(${ANCHOR_ATTR})`,
          message: RAW_COLOR_MESSAGE,
        },
        { selector: `TemplateElement[value.raw=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
        {
          selector: "JSXAttribute[name.name='style'] Property[key.name='boxShadow']",
          message: BOX_SHADOW_MESSAGE,
        },
        {
          selector: "JSXAttribute[name.name='style'] Property[key.value='boxShadow']",
          message: BOX_SHADOW_MESSAGE,
        },
      ],
    },
  },
  ...layerBoundary({
    files: ['src/components/ui/**/*.{ts,tsx}'],
    paths: [
      { name: 'axios', message: 'UI primitives must not make HTTP calls.' },
      { name: '@tanstack/react-query', message: 'UI primitives must not fetch server state.' },
    ],
    patterns: [
      ...UI_FORBIDDEN_LAYERS.map((layer) =>
        layerBan(
          layer,
          `UI primitives must not import from ${layer}/ — pass data in through props.`,
        ),
      ),
      NO_APP,
    ],
  }),
  ...layerBoundary({
    files: ['src/services/**/*.{ts,tsx}'],
    paths: [{ name: 'react', message: 'Services are framework-free; do not import React.' }],
    patterns: [
      layerBan('components', 'Services must not import UI components.'),
      layerBan('store', 'Services must not import store/ — return data to the caller.'),
      layerBan('features', 'Services must not import features/ — features call services.'),
      NO_APP,
    ],
  }),
  ...layerBoundary({
    files: ['src/store/**/*.{ts,tsx}'],
    patterns: [
      layerBan('services', 'Store atoms must not call services — features wire them.'),
      layerBan('features', 'Store must not import features/ — features read the store.'),
      NO_APP,
    ],
  }),
  ...layerBoundary({
    files: ['src/config/**/*.{ts,tsx}'],
    patterns: [
      ...CONFIG_FORBIDDEN_LAYERS.map((layer) =>
        layerBan(layer, `config/ is a leaf and must not import from ${layer}/.`),
      ),
      NO_APP,
    ],
  }),
  ...layerBoundary({ files: ['src/features/**/*.{ts,tsx}'], patterns: [NO_APP] }),
  // components/ui has its own, stricter blocks above.
  ...layerBoundary({
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    patterns: [NO_APP],
  }),
  ...lazyFeatureBoundaries(),
  prettierConfig,
]);
