// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "warn",
      "no-param-reassign": ["error", { 
        "props": true,
        "ignorePropertyModificationsFor": ["req", "res"] 
      }],
      "prefer-destructuring": ["error", { 
        "object": false, 
        "array": false 
      }]
    }
  }
];