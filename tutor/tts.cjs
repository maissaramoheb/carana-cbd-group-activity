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

function normalizeForSpeech(raw) {
  let out = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
  for (const [pattern, replacement] of TERM_REPLACEMENTS) {
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
    'let outPath = args[1], text = args[2]',
    'let synth = AVSpeechSynthesizer()',
    'let del = Del()',
    'synth.delegate = del',
    'let utt = AVSpeechUtterance(string: text)',
    'utt.voice = AVSpeechSynthesisVoice(identifier: "com.apple.ttsbundle.gryphon-neural_Nora_en-US_premium") ?? AVSpeechSynthesisVoice(language: "en-US")',
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

function synthesizeAppleNeural(text, signal) {
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
    const proc = execFile('swift', [src, caf, text], { timeout: 20000, signal }, err => {
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
          resolve({ contentType: 'audio/wav', engine: 'apple-neural-nora', buffer: buf });
        } catch (readErr) {
          cleanup();
          reject(readErr);
        }
      });
    });
    if (signal) signal.addEventListener('abort', () => proc.kill('SIGTERM'), { once: true });
  });
}

function synthesizeKokoroOnce(cfg, text, voice, signal) {
  return new Promise((resolve, reject) => {
    const worker = path.join(__dirname, '..', 'tools', 'kokoro-synth.py');
    if (!fs.existsSync(worker)) {
      reject(new Error('Local Kokoro synthesis helper not found.'));
      return;
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'carana-ktts-'));
    const out = path.join(dir, 'clip.wav');
    const safeVoice = /^(af_heart|af_bella|bf_emma|am_michael|bm_george)$/.test(voice) ? voice : 'af_heart';
    const proc = spawn(cfg.py, [worker, '--model', cfg.model, '--voices', cfg.voices, '--voice', safeVoice, '--out', out, '--text', text], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stderr = '';
    proc.stderr.on('data', c => { stderr += c.toString('utf8'); });
    const cleanup = () => { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {} };
    const timer = setTimeout(() => proc.kill('SIGTERM'), 25000);
    if (signal) signal.addEventListener('abort', () => proc.kill('SIGTERM'), { once: true });
    proc.on('close', code => {
      clearTimeout(timer);
      if (code !== 0 || !fs.existsSync(out)) {
        cleanup();
        reject(new Error(stderr.trim() || 'Kokoro synthesis failed.'));
        return;
      }
      try {
        const buffer = fs.readFileSync(out);
        cleanup();
        resolve({ contentType: 'audio/wav', engine: 'kokoro-82m-' + safeVoice, buffer });
      } catch (e) {
        cleanup();
        reject(e);
      }
    });
  });
}

function createLocalTts() {
  const cache = new Map();
  const kokoroCfg = findLocalKokoroConfig();

  function status() {
    const voices = [
      ...(kokoroCfg ? [
        { id: 'kokoro:af_heart', label: 'Kokoro Neural · Heart (US)', license: 'Apache-2.0', local: true },
        { id: 'kokoro:bf_emma', label: 'Kokoro Neural · Emma (UK)', license: 'Apache-2.0', local: true },
        { id: 'kokoro:am_michael', label: 'Kokoro Neural · Michael (US)', license: 'Apache-2.0', local: true }
      ] : []),
      ...(process.platform === 'darwin' ? [
        { id: 'apple:nora', label: 'macOS Native Neural · Voice 4 (Nora)', license: 'macOS System', local: true }
      ] : [])
    ];
    return { available: voices.length > 0, voices };
  }

  async function synthesize({ text, voice = 'kokoro:af_heart', signal }) {
    const clean = normalizeForSpeech(text);
    if (!clean) throw new Error('Text is empty.');
    const key = voice + '|' + clean;
    if (cache.has(key)) return cache.get(key);

    let result;
    if (voice === 'apple:nora' || !kokoroCfg) {
      result = await synthesizeAppleNeural(clean, signal);
    } else {
      const kVoice = voice.startsWith('kokoro:') ? voice.slice(7) : 'af_heart';
      result = await synthesizeKokoroOnce(kokoroCfg, clean, kVoice, signal);
    }

    if (cache.size >= CACHE_MAX) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }
    cache.set(key, result);
    return result;
  }

  return { status, synthesize, normalizeForSpeech };
}

module.exports = { createLocalTts, normalizeForSpeech };
