import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

// Raw colors are only allowed in the token layer (src/styles/**).
const RAW_COLOR = '/#[0-9a-f]{3,8}\\b|\\b(rgba?|hsla?)\\(/i';
const RAW_COLOR_MESSAGE = 'Use a design token (var(--…)) instead of a raw color';
const BOX_SHADOW_MESSAGE = 'Shadows are not part of the design system; do not set boxShadow';

// UI primitives must stay presentational: no data, state, or app wiring.
// Each group lists the alias form and the relative form (ADV-008).
const UI_FORBIDDEN_LAYERS = ['services', 'store', 'features', 'app'];

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
        { selector: `Literal[value=${RAW_COLOR}]`, message: RAW_COLOR_MESSAGE },
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
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'axios', message: 'UI primitives must not make HTTP calls.' },
            {
              name: '@tanstack/react-query',
              message: 'UI primitives must not fetch server state.',
            },
          ],
          patterns: UI_FORBIDDEN_LAYERS.map((layer) => ({
            group: [`@/${layer}`, `@/${layer}/**`, `**/${layer}`, `**/${layer}/**`],
            message: `UI primitives must not import from ${layer}/ — pass data in through props.`,
          })),
        },
      ],
    },
  },
  {
    files: ['src/services/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'react', message: 'Services are framework-free; do not import React.' }],
          patterns: [
            {
              group: ['@/components', '@/components/**', '**/components', '**/components/**'],
              message: 'Services must not import UI components.',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
]);
