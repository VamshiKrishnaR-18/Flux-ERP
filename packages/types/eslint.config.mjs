// ESLint v9+ (flat config) entrypoint for this workspace.
// Turbo runs `npm run lint` inside `packages/types`, so ESLint needs a local config file.

import { config as baseConfig } from '../eslint-config/base.js';

export default [
  ...baseConfig,
  {
    ignores: ['node_modules/**'],
  },
];

