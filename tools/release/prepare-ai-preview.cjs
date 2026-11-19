/* Stage isolated Vercel preview Build Output (static site + fail-closed /api proxy functions).
 * Keeps protected tools/release/prepare.cjs and public production static builds unchanged.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });

run(process.execPath, ['tools/release/prepare.cjs']);

const outputDir = path.join(root, '.vercel/output');
const manifestPath = path.join(outputDir, 'static/release-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.target = 'isolated-owner-ai-preview';
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const proxySource = fs.readFileSync(path.join(root, 'tutor/remote-proxy.cjs'));
const vcConfig = JSON.stringify(
  {
    runtime: 'nodejs22.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
    maxDuration: 60,
    shouldAddHelpers: false
  },
  null,
  2
);

const endpoints = [
  'api/tutor.func',
  'api/tutor/status.func',
  'api/tutor/auth.func',
  'api/tts.func',
  'api/health.func'
];

for (const rel of endpoints) {
  const dir = path.join(outputDir, 'functions', rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.js'), proxySource);
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"commonjs"}\n');
  fs.writeFileSync(path.join(dir, '.vc-config.json'), vcConfig + '\n');
}

console.log('Staged isolated owner AI preview (.vercel/output) with', endpoints.length, 'fail-closed Node 22 proxy functions.');
