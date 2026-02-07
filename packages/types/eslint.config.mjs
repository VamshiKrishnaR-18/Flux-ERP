

import { config as baseConfig } from '../eslint-config/base.js';

export default [
  ...baseConfig,
  {
    ignores: ['node_modules/**'],
  },
];

