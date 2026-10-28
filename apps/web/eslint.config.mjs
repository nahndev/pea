import nextPlugin from '@next/eslint-plugin-next';
import react from '@tomato/eslint-config/react';

export default [
  ...react,
  { ignores: ['.next', 'next-env.d.ts'] },
  nextPlugin.configs['core-web-vitals'],
];
