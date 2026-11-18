const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');

test('release build publishes exactly the locked media and refuses drift or absence', t => {
  const project = path.resolve(__dirname, '../..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cbd-build-integrity-'));
  t.after(() => fs.rmSync(tmp, {recursive: true, force: true}));
  for (const name of ['course','platform','curricula','css','js','tools','index.html','CARANA_CBD_Group_Activity.html',
    'module1.html','module2.html','module3.html','module4.html','module5.html','module6.html'])
    fs.cpSync(path.join(project, name), path.join(tmp,name), {recursive:true});
  fs.writeFileSync(path.join(tmp, 'private-placeholder.txt'), 'not a public asset');
  const run = () => spawnSync(process.execPath, ['tools/build-course.mjs'], {cwd:tmp, encoding:'utf8'});
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const dist = path.join(tmp,'dist');
  const ctx={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(dist,'course/lesson1-audio-manifest.js'),'utf8'),ctx);
  const manifest=ctx.window.CARANA_LESSON1_AUDIO_MANIFEST;
  assert.equal(Object.keys(manifest).length,18);
  for (const [id,url] of Object.entries(manifest)) {
    assert.match(url, /-[a-f0-9]{64}\.mp3$/);
    assert.deepEqual(fs.readFileSync(path.join(dist,'course',url)),
      fs.readFileSync(path.join(tmp,'course/audio/en/lesson1',id+'.mp3')));
  }
  assert(!fs.existsSync(path.join(dist,'private-placeholder.txt')));
  assert(!fs.existsSync(path.join(dist,'course/tests')));
  const transcript = path.join(tmp,'course/lesson1-experience.js');
  const original = fs.readFileSync(transcript,'utf8');
  fs.appendFileSync(transcript,'\nwindow.CARANA_EXPERIENCE_V05.narration.tracks[0].script += " changed";\n');
  const drift = run();
  assert.notEqual(drift.status,0);
  assert.match(drift.stderr,/transcript changed for 01-01/);
  assert(!fs.existsSync(dist));
  fs.writeFileSync(transcript,original);
  const firstTrack=path.join(tmp,'course/audio/en/lesson1/01-01.mp3');
  fs.appendFileSync(firstTrack,'changed');
  const corrupt=run();
  assert.notEqual(corrupt.status,0);
  assert.match(corrupt.stderr,/Unverified narration asset: 01-01/);
  fs.unlinkSync(firstTrack);
  const missing=run();
  assert.notEqual(missing.status,0);
  assert.match(missing.stderr,/ENOENT.*01-01\.mp3/);
  assert(!fs.existsSync(dist));
});
