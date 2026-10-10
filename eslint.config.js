import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const FRONTEND = 'apps/frontend'
const UNUSED_VARS = ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }]
const CONTEXT_HOOKS = ['useAuth', 'useThemeContext']
const HOOK_RULES = {
  'react-hooks/set-state-in-effect': 'error',
  'react-hooks/exhaustive-deps': 'error',
  'react-hooks/preserve-manual-memoization': 'error',
}

export default defineConfig([
  globalIgnores(['**/dist/', '**/dist-e2e-real-backend/', '**/dev-dist/', '**/.wrangler/', '**/coverage/', '**/.expo/', 'packages/ui-tokens/generated/', 'scripts/', '**/.stryker-tmp/', '**/reports/mutation/']),
  {
    files: ['apps/**/*.{ts,tsx}', 'packages/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': UNUSED_VARS,
    },
  },
  {
    files: [`${FRONTEND}/src/**/*.{ts,tsx}`],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      ...HOOK_RULES,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true, allowExportNames: CONTEXT_HOOKS }],
    },
  },
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    files: [`${FRONTEND}/**/*.{js,jsx}`],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: { ecmaVersion: 'latest', ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }] },
  },
  {
    files: [`${FRONTEND}/public/push-handler.js`],
    languageOptions: { globals: globals.serviceworker },
  },
])
