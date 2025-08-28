import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vitest.config.ts'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    // do not start docker compose for unit tests
    globalSetup: '',
    exclude: ['./test/integration/**', './node_modules/**'],
  },
}));
