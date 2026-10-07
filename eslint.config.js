import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['dist', 'node_modules'] },

  // Application (navigateur)
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },

  // Scripts Node, configuration, tests
  {
    files: ['scripts/**/*.mjs', '*.config.js', 'src/**/*.test.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Service worker
  {
    files: ['public/sw.js'],
    languageOptions: { globals: globals.serviceworker },
  },

  // Fonction edge Netlify (Deno)
  {
    files: ['netlify/**/*.js'],
    languageOptions: { globals: { ...globals.browser, Netlify: 'readonly' } },
  },
]
