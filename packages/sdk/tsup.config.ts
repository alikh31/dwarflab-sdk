import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
  // Bundle protobufjs into the output to avoid ESM import resolution issues
  // (protobufjs/minimal lacks .js extension which breaks Node.js ESM)
  noExternal: ['protobufjs'],
});
