import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
    // TypeScript files
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                ...globals.es2022,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            'no-undef': 'off',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    },

    // React JSX/TSX files
    {
        files: ['**/*.tsx'],
        plugins: {
            'react': reactPlugin,
            'react-hooks': reactHooks,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/jsx-uses-react': 'off',
            'react/jsx-key': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
        settings: {
            react: { version: '18.2', runtime: 'automatic' },
        },
    },

    // Prettier enforcement
    {
        files: ['**/*.{ts,tsx}'],
        plugins: { prettier: prettierPlugin },
        rules: { 'prettier/prettier': 'error' },
    },

    // Ignore build, config, and declaration files
    {
        ignores: [
            'dist/**',
            '.vite/**',
            'node_modules/**',
            '**/*.d.ts',
            '**/vite.config.ts',
            '**/*.config.js',
            '**/eslint.config.js',
        ],
    },

    // 5) Finally, turn off any conflicting rules with Prettier
    prettierConfig,
];
