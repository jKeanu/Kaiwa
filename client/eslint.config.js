// eslint.config.js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import reactRecommended from 'eslint-plugin-react/configs/recommended.js';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  reactRecommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed in React 18
      'react/jsx-uses-react': 'off', // Not needed in React 18
      'react/jsx-uses-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for any types
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { 
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_'
          }
      ]
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
        react: {
          version: 'detect'
        },
    }
  },
{
    ignores: [
      'dist/**',
      '.vite/**',
      'node_modules/**',
      '**/*.d.ts',
      '**/vite.config.ts'
    ],
  },
  prettier,
];