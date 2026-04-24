import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import path from 'path';
import babelParser from '@babel/eslint-parser';
import reactHooks from 'eslint-plugin-react-hooks';
import compat from 'eslint-plugin-compat';
import chaiFriendly from 'eslint-plugin-chai-friendly';
import globals from 'globals';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const flatCompat = new FlatCompat({ baseDirectory: dirname });

export default [
  { linterOptions: { reportUnusedDisableDirectives: false } },
  {
    ignores: [
      'deps/**',
      'mkto/**',
      'nala/results/**',
      'scripts/fallback.js',
    ],
  },
  ...flatCompat.extends('airbnb-base'),
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        allowImportExportEverywhere: true,
        sourceType: 'module',
        requireConfigFile: false,
      },
      globals: {
        ...globals.browser,
        ...globals.mocha,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      compat,
      'chai-friendly': chaiFriendly,
    },
    settings: { es: { aggressive: true } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...compat.configs.recommended.rules,
      'chai-friendly/no-unused-expressions': 2,
      'import/extensions': ['error', { js: 'always' }],
      'import/no-cycle': 0,
      'linebreak-style': ['error', 'unix'],
      'no-await-in-loop': 0,
      'no-param-reassign': [2, { props: false }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForInStatement',
          message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
        },
        {
          selector: 'LabeledStatement',
          message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
        },
        {
          selector: 'WithStatement',
          message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
        },
      ],
      'no-return-assign': ['error', 'except-parens'],
      'no-unused-expressions': 0,
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      'object-curly-newline': ['error', {
        ObjectExpression: { multiline: true, minProperties: 6 },
        ObjectPattern: { multiline: true, minProperties: 6 },
        ImportDeclaration: { multiline: true, minProperties: 6 },
        ExportDeclaration: { multiline: true, minProperties: 6 },
      }],
    },
  },
  {
    files: ['blocks/**/*.js', 'ui/controls/**/*.js'],
    rules: {
      'react-hooks/exhaustive-deps': 0,
      'react-hooks/globals': 0,
    },
  },
  {
    files: ['test/**/*.js'],
    rules: { 'no-console': 0 },
  },
  {
    files: ['build/**/*.js', 'web-test-runner.config.js', 'eslint.config.js'],
    rules: {
      'no-console': 0,
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
  {
    files: ['nala/**/*.js', 'playwright.config.js', 'browserstack.config.js'],
    rules: {
      'no-console': 0,
      'import/no-extraneous-dependencies': 0,
      'max-len': 0,
      'chai-friendly/no-unused-expressions': 0,
      'no-plusplus': 0,
      'global-require': 0,
      'object-curly-newline': 'off',
      'no-unused-vars': 'off',
      'arrow-parens': 'off',
      'one-var-declaration-per-line': 'off',
      'react-hooks/rules-of-hooks': 0,
      'react-hooks/exhaustive-deps': 0,
    },
  },
];
