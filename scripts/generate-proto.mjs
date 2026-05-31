#!/usr/bin/env node
/**
 * Regenerate the committed protobuf bindings in
 * `packages/sdk/src/generated/` from the `.proto` files in `proto/`.
 *
 * The bindings are committed to the repo so that consumers and CI don't need
 * the protobuf toolchain to build the SDK. Run this script whenever a `.proto`
 * file changes, then commit the regenerated output.
 *
 * Output is deterministic: `pbjs` sorts namespaces alphabetically, so the
 * generated files depend only on the contents of `proto/`, not on argument
 * order. Requires `protobufjs-cli` (a devDependency) which provides
 * `pbjs` + `pbts`.
 *
 * Usage: npm run proto:generate
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const protoDir = join(root, 'proto');
const outDir = join(root, 'packages', 'sdk', 'src', 'generated');
const outJs = join(outDir, 'proto.js');
const outDts = join(outDir, 'proto.d.ts');

const protoFiles = readdirSync(protoDir)
  .filter((f) => f.endsWith('.proto'))
  .sort();

if (protoFiles.length === 0) {
  console.error(`No .proto files found in ${protoDir}`);
  process.exit(1);
}

const bin = (name) =>
  join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(' ')}`);
    process.exit(res.status ?? 1);
  }
}

console.log(`Generating ${outJs} from ${protoFiles.length} proto files...`);
run(bin('pbjs'), [
  '-t', 'static-module',
  '-w', 'es6',
  '--es6',
  '-p', protoDir,
  ...protoFiles,
  '-o', outJs,
]);

console.log(`Generating ${outDts}...`);
run(bin('pbts'), [outJs, '-o', outDts]);

console.log('Done. Review the diff and commit the regenerated files.');
