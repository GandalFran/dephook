const globals = require('globals');
const pluginJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
    {
        files: ['**/*.ts', '**/*.js'],
        languageOptions: {
            parser: tseslint.parser,
            globals: {
                ...globals.node,
                ...globals.jest
            },
            ecmaVersion: 2022,
            sourceType: 'module'
        }
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            'no-console': 'off',
            'no-useless-escape': 'off',
            'no-empty': 'off'
        }
    },
    eslintPluginPrettierRecommended,
    {
        ignores: ['dist/**', 'node_modules/**']
    }
];
