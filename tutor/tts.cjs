/* Local-only neural TTS bridge for the authenticated Mac mini review server. Never staged for Vercel. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFile, spawn } = require('node:child_process');

const CACHE_MAX = 48;
const MAX_TEXT = 1200;

const TERM_REPLACEMENTS = [
  [/\bCARANA\b/g, 'Carana'],
  [/\bPESTEL-S\b/gi, 'PESTEL, S'],
  [/\bUNPOL\b/g, 'U N P O L'],
  [/\bUNSCR\b/g, 'U N S C R'],
  [/\bCBD\b/g, 'C B D'],
  [/\bMMA\b/g, 'M, M, A'],
  [/\bCPOC\b/g, 'C P O C'],
  [/\bSGBV\b/g, 'S G B V'],
  [/\bOHCHR\b/g, 'O H C H R'],
  [/\bDPO\b/g, 'D P O'],
  [/\bKPIs\b/g, 'K P I s'],
  [/\bKPI\b/g, 'K P I'],
  [/\bCOP\b/g, 'C O P'],
  [/\bUNSCR\s+(\d{2})(\d{2})\b/g, 'U N S C R $1 $2'],
  [/5\s*[×x]\s*6\b/gi, '5 by 6'],
  [/\bQ([1-6])\b/g, 'Question $1']
];

const TERM_REPLACEMENTS_FR = [
  [/\bCARANA\b/g, 'Carana'],
  [/\bPESTEL-S\b/gi, 'PESTEL S'],
  [/\bUNPOL\b/g, 'U N P O L'],
  [/\bUNSCR\b/g, 'U N S C R'],
  [/\bCBD\b/g, 'C B D'],
  [/\bMMA\b/g, 'M M A'],
  [/\bCPOC\b/g, 'C P O C'],
  [/\bSGBV\b/g, 'S G B V'],
  [/\bOHCHR\b/g, 'O H C H R'],
  [/\bDPO\b/g, 'D P O'],
  [/\bKPIs?\b/g, 'K P I'],
  [/\bCOP\b/g, 'C O P'],
  [/5\s*[×x]\s*6\b/gi, '5 par 6']
];

const TERM_REPLACEMENTS_AR = [
  [/\bPESTEL-S\b/gi, 'PESTEL S'],
  [/5\s*[×x]\s*6\b/gi, '5 في 6']
];

function normalizeForSpeech(raw, lang = 'en') {
  let out = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
  const rules = lang === 'fr-FR' ? TERM_REPLACEMENTS_FR : lang === 'ar' ? TERM_REPLACEMENTS_AR : TERM_REPLACEMENTS;
  for (const [pattern, replacement] of rules) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function findLocalKokoroConfig() {
  const candidates = [
    process.env.CARANA_TTS_HOME,
    path.join(os.homedir(), 'Library/Caches/carana-tts'),
    path.join(os.homedir(), '.cache/carana-tts')
  ].filter(Boolean);
  for (const base of candidates) {
    const py = path.join(base, 'venv/bin/python');
    const model = path.join(base, 'kokoro-v1.0.int8.onnx');
    const voices = path.join(base, 'voices-v1.0.bin');
    if (fs.existsSync(py) && fs.existsSync(model) && fs.existsSync(voices)) {
      return { base, py, model, voices };
    }
  }
  return null;
}

function ensureSwiftHelper() {
  const dir = path.join(os.tmpdir(), 'carana-apple-tts');
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const src = path.join(dir, 'synth.swift');
  const code = [
    'import AVFoundation',
    'import Foundation',
    'class Del: NSObject, AVSpeechSynthesizerDelegate {',
    '  let done = DispatchSemaphore(value: 0)',
    '  func speechSynthesizer(_ s: AVSpeechSynthesizer, didFinish u: AVSpeechUtterance) { done.signal() }',
    '  func speechSynthesizer(_ s: AVSpeechSynthesizer, didCancel u: AVSpeechUtterance) { done.signal() }',
    '}',
    'let args = CommandLine.arguments',
    'guard args.count >= 3 else { exit(2) }',
    'let outPath = args[1], text = args[2], voiceKey = args.count >= 4 ? args[3] : "apple:nora"',
    'let synth = AVSpeechSynthesizer()',
    'let del = Del()',
    'synth.delegate = del',
    'let utt = AVSpeechUtterance(string: text)',
    'if voiceKey == "apple:thomas" {',
    '  utt.voice = AVSpeechSynthesisVoice(identifier: "com.apple.voice.compact.fr-FR.Thomas") ?? AVSpeechSynthesisVoice(language: "fr-FR")',
    '} else if voiceKey == "apple:majed" {',
    '  utt.voice = AVSpeechSynthesisVoice(identifier: "com.apple.voice.compact.ar-001.Maged") ?? AVSpeechSynthesisVoice(language: "ar-001")',
    '} else {',
    '  utt.voice = AVSpeechSynthesisVoice(identifier: "com.apple.ttsbundle.gryphon-neural_Nora_en-US_premium") ?? AVSpeechSynthesisVoice(language: "en-US")',
    '}',
    'guard utt.voice != nil else { exit(4) }',
    'let outUrl = URL(fileURLWithPath: outPath)',
    'var file: AVAudioFile?',
    'var frames: AVAudioFrameCount = 0',
    'synth.write(utt) { buf in',
    '  guard let pcm = buf as? AVAudioPCMBuffer, pcm.frameLength > 0 else { return }',
    '  frames += pcm.frameLength',
    '  if file == nil { file = try? AVAudioFile(forWriting: outUrl, settings: pcm.format.settings) }',
    '  try? file?.write(from: pcm)',
    '}',
    'let deadline = Date().addingTimeInterval(15)',
    'while del.done.wait(timeout: .now()) == .timedOut && Date() < deadline {',
    '  RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))',
    '}',
    'if frames == 0 { exit(3) }'
  ].join('\n');
  if (!fs.existsSync(src) || fs.readFileSync(src, 'utf8') !== code) {
    fs.writeFileSync(src, code, { mode: 0o600 });
  }
  return { dir, src };
}

function synthesizeAppleNeural(text, voiceKey = 'apple:nora', signal) {
  return new Promise((resolve, reject) => {
    if (process.platform !== 'darwin') {
      reject(new Error('Apple Neural TTS requires macOS.'));
      return;
    }
    const { dir, src } = ensureSwiftHelper();
    const id = crypto.randomUUID();
    const caf = path.join(dir, id + '.caf');
    const wav = path.join(dir, id + '.wav');
    const cleanup = () => {
      for (const f of [caf, wav]) { try { fs.unlinkSync(f); } catch (_) {} }
    };
    const safeAppleKey = /^(apple:nora|apple:thomas|apple:majed)$/.test(voiceKey) ? voiceKey : 'apple:nora';
    const proc = execFile('swift', [src, caf, text, safeAppleKey], { timeout: 20000, signal }, err => {
      if (err) {
        cleanup();
        reject(err);
        return;
      }
      execFile('afconvert', ['-f', 'WAVE', '-d', 'LEI16@24000', caf, wav], { timeout: 10000, signal }, convErr => {
        if (convErr) {
          cleanup();
          reject(convErr);
          return;
        }
        try {
          const buf = fs.readFileSync(wav);
          cleanup();
          const engineTag = safeAppleKey === 'apple:thomas' ? 'apple-compact-thomas-fr' : safeAppleKey === 'apple:majed' ? 'apple-compact-majed-ar' : 'apple-neural-nora';
          resolve({ contentType: 'audio/wav', engine: engineTag, buffer: buf });
        } catch (readErr) {
          cleanup();
          reject(readErr);
        }
      });
    });
    if (signal) signal.addEventListener('abort', () => proc.kill('SIGTERM'), { once: true });
  });
}

function createKokoroDaemon(cfg) {
  const workerScript = path.join(__dirname, '..', 'tools', 'kokoro-synth.py');
  let proc = null;
  let readyPromise = null;
  let idleTimer = null;
  let busyChain = Promise.resolve();
  const IDLE_MS = 300000;

  function shutdown() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    if (proc) {
      try { proc.stdin.end(); } catch (_) {}
      try { proc.kill('SIGTERM'); } catch (_) {}
      proc = null;
    }
    readyPromise = null;
  }

  function touchIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(shutdown, IDLE_MS);
    if (idleTimer.unref) idleTimer.unref();
  }

  function ensureWorker() {
    if (!fs.existsSync(workerScript)) {
      return Promise.reject(new Error('Local Kokoro synthesis helper not found.'));
    }
    if (proc && !proc.killed && proc.exitCode === null && readyPromise) {
      touchIdle();
      return readyPromise;
    }
    shutdown();
    readyPromise = new Promise((resolve, reject) => {
      const child = spawn(cfg.py, [workerScript, '--model', cfg.model, '--voices', cfg.voices, '--serve-stdio'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      proc = child;
      let buf = '';
      let stderr = '';
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          shutdown();
          reject(new Error('Kokoro worker startup timed out.'));
        }
      }, 35000);
      const onStdout = chunk => {
        buf += chunk.toString('utf8');
        const nl = buf.indexOf('\n');
        if (nl >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          child.stdout.off('data', onStdout);
          clearTimeout(timer);
          if (!settled) {
            settled = true;
            try {
              const msg = JSON.parse(line);
              if (msg.ready) {
                touchIdle();
                resolve({ child, leftover: buf });
                return;
              }
            } catch (_) {}
            shutdown();
            reject(new Error('Kokoro worker failed readiness handshake.'));
          }
        }
      };
      child.stdout.on('data', onStdout);
      child.stderr.on('data', d => { stderr += d.toString('utf8'); });
      child.once('close', code => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          proc = null;
          readyPromise = null;
          reject(new Error(stderr.trim() || 'Kokoro worker exited with code ' + code));
        } else if (proc === child) {
          proc = null;
          readyPromise = null;
        }
      });
    });
    return readyPromise;
  }

  async function synthesize(text, voice, signal) {
    if (signal?.aborted) throw new Error('Speech request aborted.');
    const safeVoice = /^(af_heart|af_bella|bf_emma|bf_alice|am_michael|bm_george|ff_siwis)$/.test(voice) ? voice : 'af_heart';
    const kLang = safeVoice.startsWith('ff_') ? 'fr-fr' : safeVoice.startsWith('b') ? 'en-gb' : 'en-us';
    const job = busyChain.then(async () => {
      if (signal?.aborted) throw new Error('Speech request aborted.');
      const { child } = await ensureWorker();
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'carana-ktts-'));
      const out = path.join(dir, 'clip.wav');
      const cleanup = () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {} };
      try {
        await new Promise((resolve, reject) => {
          let buf = '';
          let settled = false;
          const finish = err => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            child.stdout.off('data', onData);
            child.off('close', onClose);
            if (signal) signal.removeEventListener('abort', onAbort);
            if (err) reject(err);
            else resolve();
          };
          const timer = setTimeout(() => {
            shutdown();
            finish(new Error('Kokoro synthesis timed out.'));
          }, 42000);
          const onAbort = () => finish(new Error('Speech request aborted.'));
          const onClose = code => finish(new Error('Kokoro worker exited (' + code + ').'));
          const onData = chunk => {
            buf += chunk.toString('utf8');
            let nl;
            while ((nl = buf.indexOf('\n')) >= 0) {
              const line = buf.slice(0, nl).trim();
              buf = buf.slice(nl + 1);
              if (!line) continue;
              try {
                const msg = JSON.parse(line);
                if ('ok' in msg) {
                  if (msg.ok) finish(null);
                  else finish(new Error(msg.error || 'Kokoro synthesis error.'));
                  return;
                }
              } catch (_) {}
            }
          };
          if (signal) signal.addEventListener('abort', onAbort, { once: true });
          child.stdout.on('data', onData);
          child.once('close', onClose);
          child.stdin.write(JSON.stringify({ text, voice: safeVoice, lang: kLang, out }) + '\n');
        });
        touchIdle();
        const buffer = fs.readFileSync(out);
        cleanup();
        return { contentType: 'audio/wav', engine: 'kokoro-82m-' + safeVoice, buffer };
      } catch (e) {
        cleanup();
        throw e;
      }
    });
    busyChain = job.catch(() => {});
    return job;
  }

  return { synthesize, shutdown };
}

function createLocalTts() {
  const cache = new Map();
  const kokoroCfg = findLocalKokoroConfig();
  const kokoroDaemon = kokoroCfg ? createKokoroDaemon(kokoroCfg) : null;

  function status() {
    const voices = [
      ...(kokoroCfg ? [
        { id: 'kokoro:af_heart', lang: 'en', label: 'Kokoro Neural · Heart (US)', license: 'Apache-2.0', local: true },
        { id: 'kokoro:bf_emma', lang: 'en', label: 'Kokoro Neural · Emma (UK)', license: 'Apache-2.0', local: true },
        { id: 'kokoro:am_michael', lang: 'en', label: 'Kokoro Neural · Michael (US)', license: 'Apache-2.0', local: true },
        { id: 'kokoro:ff_siwis', lang: 'fr-FR', label: 'Kokoro Neural · Siwis (FR · pending review)', license: 'Apache-2.0', local: true, pendingApproval: true }
      ] : []),
      ...(process.platform === 'darwin' ? [
        { id: 'apple:nora', lang: 'en', label: 'macOS Native Neural · Voice 4 (Nora)', license: 'macOS System', local: true },
        { id: 'apple:thomas', lang: 'fr-FR', label: 'macOS System · Thomas (fr-FR · compact)', license: 'macOS System', local: true, pendingApproval: true },
        { id: 'apple:majed', lang: 'ar', label: 'macOS System · Majed (ar-001 · compact)', license: 'macOS System', local: true, pendingApproval: true }
      ] : [])
    ];
    return { available: voices.length > 0, voices };
  }

  async function synthesize({ text, voice, lang = 'en', signal }) {
    const safeLang = lang === 'fr-FR' || lang === 'ar' ? lang : 'en';
    const defaultVoice =
      safeLang === 'fr-FR'
        ? (kokoroDaemon ? 'kokoro:ff_siwis' : 'apple:thomas')
        : safeLang === 'ar'
          ? 'apple:majed'
          : 'kokoro:af_heart';
    const requestedVoice = voice || defaultVoice;
    const clean = normalizeForSpeech(text, safeLang);
    if (!clean) throw new Error('Text is empty.');

    // Strict language isolation: never synthesize an English voice when FR or AR is requested.
    let targetVoice = requestedVoice;
    if (safeLang === 'ar') {
      targetVoice = 'apple:majed';
    } else if (safeLang === 'fr-FR') {
      if (targetVoice !== 'kokoro:ff_siwis' && targetVoice !== 'apple:thomas') {
        targetVoice = kokoroDaemon ? 'kokoro:ff_siwis' : 'apple:thomas';
      }
    } else if (targetVoice === 'kokoro:ff_siwis' || targetVoice === 'apple:thomas' || targetVoice === 'apple:majed') {
      targetVoice = 'kokoro:af_heart';
    }

    const key = safeLang + '|' + targetVoice + '|' + clean;
    if (cache.has(key)) return cache.get(key);

    let result;
    if (targetVoice.startsWith('apple:') || !kokoroDaemon) {
      const appleVoice = safeLang === 'ar' ? 'apple:majed' : safeLang === 'fr-FR' ? 'apple:thomas' : 'apple:nora';
      result = await synthesizeAppleNeural(clean, appleVoice, signal);
    } else {
      const kVoice = targetVoice.startsWith('kokoro:') ? targetVoice.slice(7) : (safeLang === 'fr-FR' ? 'ff_siwis' : 'af_heart');
      try {
        result = await kokoroDaemon.synthesize(clean, kVoice, signal);
      } catch (kokoroErr) {
        if (signal?.aborted || process.platform !== 'darwin') throw kokoroErr;
        const appleFallback = safeLang === 'fr-FR' ? 'apple:thomas' : 'apple:nora';
        result = await synthesizeAppleNeural(clean, appleFallback, signal);
      }
    }

    if (cache.size >= CACHE_MAX) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }
    cache.set(key, result);
    return result;
  }

  function shutdown() {
    kokoroDaemon?.shutdown();
  }

  return { status, synthesize, normalizeForSpeech, shutdown };
}

module.exports = { createLocalTts, normalizeForSpeech };
