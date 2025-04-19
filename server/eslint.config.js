// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
    js.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs}'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
            'no-console': 'warn',
            'no-param-reassign': [
                'error',
                {
                    props: true,
                    ignorePropertyModificationsFor: ['req', 'res', 'socket', 'acc'],
                },
            ],
            'prefer-destructuring': [
                'error',
                {
                    object: false,
                    array: false,
                },
            ],
            'no-unused-vars': [
                'warn',
                {
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    },
    eslintConfigPrettier,
];
