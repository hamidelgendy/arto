import { resolve } from 'pathe'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import tsEslintPlugin from '@typescript-eslint/eslint-plugin'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import { configs as tsConfigs } from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: [
      '**/dist/**',
      'public',
      'node_modules',
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/postcss.config.mjs',
      'docs/.vitepress/cache',
      '**/eslint.config.mjs',
    ],
  },

  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',

        project: [
          resolve('./tsconfig.json'),
          resolve('./packages/arto/tsconfig.json'),
          resolve('./examples/react/tsconfig.json'),
        ],
        tsconfigRootDir: process.cwd(),
      },

      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    settings: {
      react: {
        version: '19.0.0',
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx', '.js', '.jsx'],
      },
      'import/resolver': {
        typescript: {
          project: [
            './tsconfig.json',
            './packages/arto/tsconfig.json',
            './examples/react/tsconfig.json',
          ],
        },
      },
    },

    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },

    rules: {
      //----------------------------------------------------
      // TypeScript Recommended + Strict
      //----------------------------------------------------
      ...tsConfigs.recommended.rules,
      ...tsConfigs['recommended-requiring-type-checking'].rules,

      //----------------------------------------------------
      // React & Hooks Recommended
      //----------------------------------------------------
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      //----------------------------------------------------
      // A11y Recommended
      //----------------------------------------------------
      ...jsxA11yPlugin?.configs.recommended.rules,

      //----------------------------------------------------
      // Import Plugin Recommended
      //----------------------------------------------------
      ...importPlugin.configs.recommended.rules,

      // React 18+ no longer needs "import React from 'react'"
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',

      //----------------------------------------------------
      // Prettier Enforcement
      //----------------------------------------------------
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/__tests__/**', '**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
]
