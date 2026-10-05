// Tokens-only CSS: every color, spacing, type and radius value comes from a
// design token (var(--…)). src/styles/tokens.css is generated and is the one
// place raw values live, so it is exempt from every rule.

/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['src/styles/tokens.css', 'dist/**', 'coverage/**'],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'hwb',
      'lab',
      'lch',
      'oklch',
      'color',
    ],
    'property-disallowed-list': ['box-shadow', 'text-shadow'],
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'fill',
        'stroke',
        'background',
        'font',
        'font-size',
        'line-height',
        'font-weight',
        '/^padding/',
        '/^margin/',
        '/gap$/',
        'border-radius',
      ],
      {
        ignoreValues: [
          '0',
          'inherit',
          'initial',
          'unset',
          'currentcolor',
          'transparent',
          'none',
          'auto',
          '100%',
        ],
      },
    ],
    // CSS Modules class names are used from TS as styles.fooBar.
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'Use camelCase class names (CSS Modules)' },
    ],
  },
};
