import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // scripts/ holds standalone Node ESM tooling (seed, db, katex) and Khmer
    // course-content data files. They are not part of the app's TypeScript
    // program (so the type-aware project service can't parse them), and the
    // Khmer text uses intentional zero-width spaces that would trip
    // no-irregular-whitespace — so exclude the whole directory from linting.
    ignores: ['eslint.config.mjs', 'scripts/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    // Jest idioms these type-aware rules misread: asserting on a mocked
    // method (expect(obj.fn).toHaveBeenCalled()) is an "unbound method", and
    // asymmetric matchers such as expect.stringMatching() are typed `any`.
    files: ['**/*.spec.ts', '**/*.int-spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
);
