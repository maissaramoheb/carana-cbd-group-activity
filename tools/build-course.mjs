import validateContent from './validate-content.cjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const hash = value => createHash('sha256').update(value).digest('hex');
const read = name => fs.readFile(path.join(root, name));
const audio = 'course/audio/en/lesson1';
const ids = Array.from({ length: 18 }, (_, i) => `0${1 + Math.floor(i / 3)}-0${1 + i % 3}`);
const sandbox = { window: {} };

validateContent(root);
await fs.rm(dist, { recursive: true, force: true });
vm.runInNewContext((await read('course/lesson1-experience.js')).toString(), sandbox, { timeout: 3000 });
const tracks = sandbox.window.CARANA_EXPERIENCE_V05.narration.tracks;
const lock = JSON.parse(await read('tools/narration-lock.json'));
if (lock.version !== 1 || tracks.length !== ids.length ||
    Object.keys(lock.tracks).length !== ids.length) throw Error('Expected the full 18-track narration lock');

const validated = await Promise.all(ids.map(async (id, i) => {
  const track = tracks[i];
  const record = lock.tracks[id];
  if (track.id !== id || !record || hash(track.script) !== record.scriptSha256)
    throw Error(`Narration transcript changed for ${id}; review and pair the recording before building`);
  const bytes = await read(`${audio}/${id}.mp3`);
  const digest = hash(bytes);
  if (digest !== record.audioSha256 || bytes.length < 12000 ||
      !(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224)))
    throw Error(`Unverified narration asset: ${id}`);
  return { id, bytes, name: `${id}-${digest}.mp3` };
}));

// Stage only known public assets. Do not publish docs, tests or arbitrary workspace files.
const original = ['platform', 'curricula', 'locales', 'index.html', 'CARANA_CBD_Group_Activity.html', 'css', 'js',
  ...Array.from({ length: 6 }, (_, i) => `module${i + 1}.html`)];
await fs.mkdir(path.join(dist, 'course'), { recursive: true });
for (const name of original) {
  if (name === 'locales') { try { await fs.stat(path.join(root, name)); } catch { continue; } }
  await fs.cp(path.join(root, name), path.join(dist, name), { recursive: true });
}
for (const item of await fs.readdir(path.join(root, 'course'), { withFileTypes: true })) {
  if ((item.isFile() && /\.(?:html|js|css)$/.test(item.name)) || item.name === 'illustrations')
    await fs.cp(path.join(root, 'course', item.name), path.join(dist, 'course', item.name), { recursive: true });
}
await fs.mkdir(path.join(dist, audio), { recursive: true });
for (const { name, bytes } of validated) await fs.writeFile(path.join(dist, audio, name), bytes);
for (const extraAudio of ['course/audio/en/readaloud', 'course/audio/en/comparison']) {
  const srcDir = path.join(root, extraAudio);
  try {
    const stat = await fs.stat(srcDir);
    if (stat.isDirectory()) await fs.cp(srcDir, path.join(dist, extraAudio), { recursive: true });
  } catch (_) {}
}
const manifest = Object.fromEntries(validated.map(({ id, name }) => [id, `./audio/en/lesson1/${name}`]));
await fs.writeFile(path.join(dist, 'course/lesson1-audio-manifest.js'),
  `/* Generated from verified local recordings. */\nwindow.CARANA_LESSON1_AUDIO_MANIFEST = ${JSON.stringify(manifest, null, 2)};\nwindow.CARANA_LESSON1_AUDIO_AI_MODE = true;\n`);
console.log('Course built with 18 verified local recordings; no generation or network required.');

// Monitoring is an output-only addition; original single-file activities stay intact.
const monitoredPages = ['course/index.html', 'platform/index.html', 'platform/notebook.html',
  'CARANA_CBD_Group_Activity.html', ...Array.from({ length: 6 }, (_, i) => `module${i + 1}.html`)];
for (const page of monitoredPages) {
  const file = path.join(dist, page);
  const html = await fs.readFile(file, 'utf8');
  const scripts = '<script src="/js/monitoring-config.js" defer></script><script src="/js/monitoring.js" defer></script>';
  await fs.writeFile(file, html.replace('</head>', scripts + '</head>'));
}

// Closed allowlist for the protected owner review; never publish the docs tree.
const reviewRoot = 'platform/review/run08';
for (const name of ['TRILINGUAL_REVIEW_MATRIX.json', 'TERMINOLOGY_GLOSSARY.json']) {
  const source = name === 'TERMINOLOGY_GLOSSARY.json' ? 'docs/localization/' + name : 'docs/reviews/run08-trilingual/' + name;
  await fs.copyFile(path.join(root, source), path.join(dist, reviewRoot, name));
}
await fs.mkdir(path.join(dist, reviewRoot, 'audio-samples'), { recursive: true });
for (const name of ['fr-kokoro-norm-smart.mp3', 'fr-kokoro-norm-unpol.mp3', 'fr-kokoro-raw-unpol.mp3', 'fr-macos-thomas-unpol.mp3', 'ar-macos-majed-l1.mp3', 'ar-macos-majed-l2.mp3']) {
  await fs.copyFile(path.join(root, 'docs/reviews/run08-trilingual/audio-samples', name), path.join(dist, reviewRoot, 'audio-samples', name));
}
