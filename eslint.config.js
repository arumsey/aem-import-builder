import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    rules: {
      'quotes': ['error', 'single'],
      '@typescript-eslint/no-unused-vars': ['error', {'caughtErrors': 'none'}]}
  }
];
