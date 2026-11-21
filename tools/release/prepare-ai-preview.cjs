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

const isProd = process.argv.includes('--production');
const targetArgIdx = process.argv.indexOf('--target');
const targetName = targetArgIdx >= 0 && process.argv[targetArgIdx + 1]
  ? String(process.argv[targetArgIdx + 1]).trim()
  : isProd
    ? 'controlled-production-pilot'
    : 'isolated-owner-ai-preview';

const outputDir = path.join(root, '.vercel/output');
const configPath = path.join(outputDir, 'config.json');
const vercelConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
for (const route of vercelConfig.routes || []) {
  if (route.src === '^/quick-exercise/?$') {
    route.dest = '/CARANA_CBD_Group_Activity';
  }
}
// Vercel serves these static HTML files under clean URLs. Preserve legacy .html links
// by rewriting internally, so language query parameters and relative links survive.
vercelConfig.routes.unshift({
  src: '^/(module[1-6]|CARANA_CBD_Group_Activity|index|platform/(?:index|notebook|demo|demo-showcase)|platform/review/run08/index|course/(?:index|visual-gallery|voice-audition))\\.html$',
  dest: '/$1'
});
fs.writeFileSync(configPath, JSON.stringify(vercelConfig, null, 2) + '\n');

const manifestPath = path.join(outputDir, 'static/release-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.target = targetName;
if (isProd) manifest.fieldPilot = 'restricted-invitation-only';
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
