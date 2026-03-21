import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Change TypeScript lint rules from error to warn
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Change React lint rules from error to warn
      'react/no-unescaped-entities': 'warn',

      // Change Next.js lint rules from error to warn
      '@next/next/no-assign-module-variable': 'warn',
    },
  },
]

export default eslintConfig
