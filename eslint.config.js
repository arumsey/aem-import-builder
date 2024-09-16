import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin'

export default [
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['src/**/*.ts', 'test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['error', {'caughtErrors': 'none'}]
      }
    },
    {
      plugins: {
        '@stylistic': stylistic
      },
      rules: {
        '@stylistic/indent': ['error', 2],
        '@stylistic/quotes': ['error', 'single'],
        '@stylistic/comma-dangle': ['error', 'always-multiline']
      }
    },
    {
      files: ['test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off'}
    },
    {
      ignores: ['**/*.js', '**/*.d.ts'],
    }
];
