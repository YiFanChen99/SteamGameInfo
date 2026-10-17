import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Shared by every package without its own eslint.config.js. ESLint uses the
// config nearest to each linted file, so packages/userscript-steamgifts keeps
// its own config until it is folded into this one.
export default defineConfig([
    globalIgnores(['**/dist/', '**/legacy/', '_site/']),

    {
        files: ['**/*.{js,mjs}'],
        extends: [js.configs.recommended],
        languageOptions: {
            globals: globals.node,
        },
    },

    {
        files: ['**/*.ts'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
            tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
        },
    },
]);
