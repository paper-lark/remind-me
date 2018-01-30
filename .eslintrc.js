module.exports = {
  extends: [
    'eslint:recommended',
    'prettier',
    'prettier/standard',
    'plugin:flowtype/recommended'
  ],
  plugins: ['prettier', 'flowtype', 'node'],
  env: {
    es6: true,
    node: true
  },
  rules: {
    'prettier/prettier': [
      'error', { 
        singleQuote: true, 
        trailingComma: 'none', 
        bracketSpacing: true, 
        semi: true 
      }
    ],
    'no-console': 'off'
  }
};
  