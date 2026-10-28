import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import base from './index.mjs';

export default [
  ...base,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: { globals: { ...globals.browser } },
  },
];
