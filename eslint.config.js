import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: [
      'dist/',
      '.astro/',
      '.vercel/',
      'node_modules/',
      'qa/',
      'test-results/',
      'eslint.config.js',
    ],
  },
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\b(ease-in-out|ease-in|ease-out)\\b/]',
          message: 'Use a named easing token from DESIGN.md, never a CSS keyword easing.',
        },
      ],
    },
  },
];
