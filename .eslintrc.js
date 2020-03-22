'use strict'

module.exports = {
  plugins: ['@novemberborn/as-i-preach'],
  extends: ['plugin:@novemberborn/as-i-preach/nodejs'],
  overrides: [
    {
      files: ['test/**/*'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: 'module',
      },
      extends: ['plugin:react/recommended'],
    },
  ],
}
