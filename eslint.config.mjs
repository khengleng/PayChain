import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/**
 * Flat ESLint config for the PayChain monorepo. Fast (no type-checking), tuned so TypeScript
 * remains the source of truth for type errors while ESLint catches lint-level issues.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/coverage/**',
      'packages/database/prisma/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // TypeScript already reports undefined identifiers and unused vars with types.
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // The Next apps: register the plugins whose rules the portal code already references in
    // eslint-disable comments. Without them ESLint errors on every disable directive for a rule
    // it does not know — which is what kept `pnpm lint` red, and why CI could never be green.
    files: ['apps/admin-portal/**/*.{ts,tsx}', 'apps/developer-portal/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      // The two classic hook rules — the ones the code's disable directives actually reference.
      // Not reactHooks' full recommended set: its newer additions flag `void load()` inside an
      // effect as "setState synchronously in an effect", which is neither true (the state lands
      // after an await) nor worth refactoring five screens to satisfy.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
