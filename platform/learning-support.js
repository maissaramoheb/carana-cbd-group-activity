/* CARANA learner support: Studio Read Aloud (Neural + Browser fallback) and Contextual Learning Companion.
 * Strict constraints: no progress/storage writes, no model secrets in browser storage, no draft collection. */
(function () {
  'use strict';

  const SCRIPT_SRC = document.currentScript?.src || '';
  const READALOUD_BASE = SCRIPT_SRC
    ? new URL('../course/audio/en/readaloud/', SCRIPT_SRC).href
    : '../course/audio/en/readaloud/';

  const RATES = [0.75, 1, 1.25, 1.5, 1.75];
  const EXPLANATION_SEL =
    '#vj-result, #vj-mini-feedback, #lab-response, #concept-feedback, #decision-feedback, #lab-feedback, #priority-result, #priority-compare, #risk-result, [data-read-explanation="true"]';
  const APPLIED_ALLOWED_SEL =
    'h2, h3, .worked-example[open] p, .worked-example[open] li, #lab-feedback, #priority-result, #priority-compare, #risk-result, [id^="lab-item-"], [id^="lab-check-item-"]';
  const EXCLUDED_SEL =
    '.support-ui, .support-inline-bar, .support-inline-read, nav, button, input, select, textarea, iframe, .archived-drafts, .handoff-section, .handoff-sheet, .restore-preview, .l1-restore-preview, .version-note, .study-modal, [data-learner-content], .rail, .context-panel, .voice-controls, .voice-meta, .voice-availability, .voice-production-note, .voice-time, .voice-transcript-foot, .lesson-foot, .applied-lab .tool-controls, .applied-lab .tool-item-controls';

  const PRONUNCIATION_MAP = [
    [/\bCARANA\b/g, 'Carana'],
    [/\bPESTEL-S\b/gi, 'PESTEL, S'],
    [/\bUNPOL\b/g, 'U N P O L'],
    [/\bUNSCR\s+(\d{2})(\d{2})\b/g, 'U N S C R $1 $2'],
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
    [/5\s*[×x]\s*6\b/gi, '5 by 6'],
    [/\bQ([1-6])\b/g, 'Question $1']
  ];

  const speech = window.speechSynthesis;
  let speechGeneration = 0;
  let current = null;
  let reader = null;
  let panel = null;
  let request = null;
  let ttsRequest = null;
  let activeAudio = null;
  let activeAudioUrl = '';
  let activeUtterance = null;
  let activeObserver = null;
  let access = '';
  let accessUser = null;
  let conversation = [];
  let contextKey = '';
  let selected = null;
  let manifestData = window.CARANA_READALOUD_MANIFEST || null;
  let manifestPromise = null;
  let localTtsInfo = { available: false, voices: [] };
  const dynamicAudioCache = new Map();

  const esc = v =>
    String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Compact synchronous SHA-256 so manifest clip hashes resolve on http, https, or file origins in 0 ms. */
  function sha256Hex(str) {
    const bytes = new TextEncoder().encode(str);
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const bitLen = bytes.length * 8;
    const totalLen = ((bytes.length + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(totalLen);
    buf.set(bytes);
    buf[bytes.length] = 0x80;
    const view = new DataView(buf.buffer);
    view.setUint32(totalLen - 4, bitLen >>> 0, false);
    view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < totalLen; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return H.map(x => x.toString(16).padStart(8, '0')).join('');
  }

  const normalizeKey = text => String(text || '').replace(/\s+/g, ' ').trim();

  function prepareSpeechText(text) {
    let out = normalizeKey(text);
    for (const [pattern, replacement] of PRONUNCIATION_MAP) {
      out = out.replace(pattern, replacement);
    }
    return out;
  }

  async function loadManifest() {
    if (manifestData) return manifestData;
    if (!manifestPromise) {
      manifestPromise = fetch(READALOUD_BASE + 'manifest.json', { cache: 'no-cache' })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data && data.clips) manifestData = data;
          return manifestData;
        })
        .catch(() => null);
    }
    return manifestPromise;
  }

  function studioClipUrl(rawText) {
    if (!manifestData?.clips) return '';
    const norm = normalizeKey(rawText);
    if (!norm) return '';
    const h = sha256Hex(norm).slice(0, 16);
    const rel = manifestData.clips[h];
    return rel ? new URL(rel, READALOUD_BASE).href : '';
  }

  function visible(el) {
    return !!el && !!el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden],[aria-hidden="true"]');
  }

  function joinReadableSegments(el, includeQuestions) {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const pieces = [];
    let lastContainer = null;
    let node;
    while ((node = walk.nextNode())) {
      const p = node.parentElement;
      if (!p || !visible(p) || p.closest(EXCLUDED_SEL)) continue;
      if (!includeQuestions && p.closest('fieldset,.question-card,.choices,.quiz-hint,.answer-hint')) continue;
      const t = node.textContent.replace(/\s+/g, ' ').trim();
      if (!t) continue;
      const blockParent = p.closest('p, strong, li, h1, h2, h3, span.vj-selected-tag, span.concept-selected-tag, div');
      if (pieces.length && blockParent && blockParent !== lastContainer) {
        const prev = pieces[pieces.length - 1];
        if (!/[.!?:;—–]$/.test(prev) && !p.closest('em, a, code, span:not(.vj-selected-tag):not(.concept-selected-tag)')) {
          pieces[pieces.length - 1] = prev + '.';
        }
      }
      pieces.push(t);
      lastContainer = blockParent;
    }
    return pieces.join(' ').replace(/\s+/g, ' ').trim();
  }

  function extractBlockText(el, includeQuestions = false) {
    let text = joinReadableSegments(el, includeQuestions);
    const title = (el.dataset?.readTitle || '').replace(/\s+/g, ' ').trim();
    if (title && text && !text.toLowerCase().startsWith(title.toLowerCase())) {
      text = title + (/[.!?:;]$/.test(title) ? ' ' : '. ') + text;
    }
    return text;
  }

  function isAppliedLabReadable(el) {
    if (!el.closest('.applied-lab')) return true;
    if (el.matches(APPLIED_ALLOWED_SEL)) return true;
    return el.matches('.applied-lab > p, .tool-head p');
  }

  function blocks(root, includeQuestions = false) {
    if (!root) return [];
    const selectors = [
      'h1', 'h2', 'h3', 'p', 'li', 'legend',
      '.takeaway strong', '.worked-contrast strong', 'label.choice span', '#vj-case-text',
      '#vj-result', '#vj-mini-feedback', '#lab-response', '#concept-feedback', '#decision-feedback',
      '#lab-feedback', '#priority-result', '#priority-compare', '#risk-result',
      '[id^="lab-item-"]', '[id^="lab-check-item-"]', '[data-read-explanation="true"]'
    ].join(',');
    const dedupAncestors =
      'p, li, legend, #vj-result, #vj-mini-feedback, #lab-response, #concept-feedback, #decision-feedback, #lab-feedback, #priority-result, #priority-compare, #risk-result, [data-read-explanation="true"]';

    return [...root.querySelectorAll(selectors)]
      .filter(el => visible(el) && !el.closest(EXCLUDED_SEL))
      .filter(el => !el.closest('.trainer-voice') || el.closest('.voice-transcript'))
      .filter(el => includeQuestions || !el.closest('fieldset, .question-card, .choices, .quiz-hint, .answer-hint'))
      .filter(el => isAppliedLabReadable(el))
      .filter(el => !el.parentElement?.closest(dedupAncestors))
      .map(el => ({ el, text: extractBlockText(el, includeQuestions) }))
      .filter(x => x.text.length > 2);
  }

  function clearFocus() {
    document.querySelectorAll('[data-read-current]').forEach(el => el.removeAttribute('data-read-current'));
    document.querySelectorAll('.support-inline-read[aria-pressed="true"]').forEach(btn => {
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = btn.dataset.defaultLabel || 'Read this explanation';
    });
  }

  function releaseAudio() {
    ttsRequest?.abort();
    ttsRequest = null;
    if (activeAudio) {
      try {
        activeAudio.onended = null;
        activeAudio.onerror = null;
        activeAudio.onplay = null;
        activeAudio.pause();
        activeAudio.removeAttribute('src');
        activeAudio.load?.();
      } catch (_) {}
      activeAudio = null;
    }
    if (activeAudioUrl) {
      try { URL.revokeObjectURL(activeAudioUrl); } catch (_) {}
      activeAudioUrl = '';
    }
  }

  function releaseSpeech() {
    if (activeUtterance) {
      try {
        activeUtterance.onstart = null;
        activeUtterance.onend = null;
        activeUtterance.onerror = null;
      } catch (_) {}
      activeUtterance = null;
    }
    try { speech?.cancel(); } catch (_) {}
  }

  function stopExternalMedia() {
    document.querySelectorAll('audio, video').forEach(el => {
      if (el !== activeAudio) {
        try { el.pause(); } catch (_) {}
      }
    });
  }

  function stopRead(message = 'Stopped. You can restart this screen.') {
    speechGeneration++;
    releaseAudio();
    releaseSpeech();
    if (reader) {
      reader.generation = speechGeneration;
      reader.playing = false;
      reader.paused = false;
      reader.pendingAdvance = false;
      reader.utterance = null;
      reader.mode = 'screen';
      reader.activeTarget = null;
      clearTimeout(reader.watchdog);
      reader.bar?.setAttribute('data-read-state', 'idle');
      if (reader.badge) reader.badge.textContent = 'Ready';
    }
    clearFocus();
    if (reader?.status?.isConnected) {
      reader.status.textContent = message;
      reader.play.textContent = 'Read screen';
      reader.pause.disabled = true;
      reader.resume.disabled = true;
      if (reader.stop) reader.stop.disabled = true;
    }
  }

  function selectionSnapshot() {
    if (!current) return;
    const active = document.activeElement;
    if (active && /TEXTAREA|INPUT/.test(active.tagName) && current.root.contains(active) && active.selectionEnd > active.selectionStart) {
      selected = {
        text: active.value.slice(active.selectionStart, active.selectionEnd).slice(0, 1800),
        el: active,
        private: true
      };
      return;
    }
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && current.root.contains(sel.anchorNode) && current.root.contains(sel.focusNode)) {
      const node = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
      if (node && !node.closest('.support-ui')) {
        selected = {
          text: sel.toString().trim().slice(0, 1800),
          el: node.closest('p,li,h1,h2,h3,#vj-result,#concept-feedback,#lab-response') || node,
          private: !!node.closest('.applied-lab,.handoff-section,.handoff-sheet,.archived-drafts,.restore-preview,.l1-restore-preview,[data-learner-content]')
        };
      }
    }
  }

  function rankBrowserVoice(v) {
    let score = 0;
    if (/(Neural|Natural|Premium|Enhanced|Siri|Online)/i.test(v.name + ' ' + v.voiceURI)) score += 100;
    if (v.localService) score += 20;
    if (/(compact|super-compact)/i.test(v.voiceURI + ' ' + v.name)) score -= 25;
    if (/\b(Nora|Ava|Zoe|Serena|Jamie|Stephanie|Daniel|Karen|Moira)\b/i.test(v.name)) score += 10;
    if (/^Samantha$/i.test(v.name)) score -= 5;
    return score;
  }

  function filterBrowserVoices() {
    if (!speech?.getVoices) return [];
    const exclusions = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Fred|Good News|Jester|Junior|Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i;
    const available = speech.getVoices().filter(
      v => (/^en(?:-|_)/i.test(v.lang) || v.lang === 'en') &&
        !exclusions.test(v.name) &&
        !/eloquence/i.test(v.voiceURI || '')
    );
    return [...new Map(available.map(v => [v.name + '|' + v.lang + '|' + v.localService, v])).values()]
      .sort((a, b) => rankBrowserVoice(b) - rankBrowserVoice(a) || a.name.localeCompare(b.name));
  }

  function splitIntoSpeakableChunks(list) {
    return list.flatMap(item => {
      const clean = normalizeKey(item.text);
      if (!clean) return [];
      // Preserve single atomic clip lookup for pre-rendered blocks when possible.
      if (studioClipUrl(clean) || clean.length <= 520) {
        return [{ ...item, text: clean }];
      }
      const chunks = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
      let part = '';
      const out = [];
      for (const sentence of chunks) {
        if ((part + sentence).length > 420 && part) {
          out.push({ ...item, text: part.trim() });
          part = '';
        }
        part += sentence;
      }
      if (part.trim()) out.push({ ...item, text: part.trim() });
      return out;
    });
  }

  async function fetchLocalNeuralWav(text, voiceId, signal) {
    if (!access || !localTtsInfo.available) return null;
    const key = voiceId + '|' + text;
    if (dynamicAudioCache.has(key)) {
      const cached = dynamicAudioCache.get(key);
      return URL.createObjectURL(cached);
    }
    const resp = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + access },
      body: JSON.stringify({ text: text.slice(0, 1200), voice: voiceId }),
      signal
    });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    if (dynamicAudioCache.size >= 24) {
      const oldest = dynamicAudioCache.keys().next().value;
      dynamicAudioCache.delete(oldest);
    }
    dynamicAudioCache.set(key, blob);
    return URL.createObjectURL(blob);
  }

  function updateReadingHighlight(el, text, idx, total, targetButton) {
    if (reader?.paused) return;
    clearFocus();
    if (el?.isConnected) {
      el.dataset.readCurrent = 'true';
      const rect = el.getBoundingClientRect();
      if (rect.top < 72 || rect.bottom > window.innerHeight - 48) {
        el.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
      }
    }
    if (targetButton?.isConnected) {
      targetButton.setAttribute('aria-pressed', 'true');
      targetButton.textContent = 'Stop explanation';
    }
    const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 68);
    if (reader) {
      const modeLabel = reader.mode === 'explanation' ? 'Reading explanation' : `Reading passage ${idx + 1} of ${total}`;
      reader.status.textContent =
        `${modeLabel} · paragraph focus` + (snippet ? ` — “${snippet}${text.length > 68 ? '…”' : '”'}` : '');
      reader.play.textContent = 'Restart screen';
      reader.pause.disabled = false;
      reader.resume.disabled = true;
      reader.stop.disabled = false;
      reader.bar?.setAttribute('data-read-state', 'playing');
      if (reader.badge) {
        reader.badge.textContent = reader.mode === 'explanation' ? 'Explanation' : `Reading ${idx + 1}/${total}`;
      }
    }
  }

  function readList(list, opts = {}) {
    if (!reader) return;
    const selectedOption = reader.voices.find(v => v.value === reader.voice.value) || reader.voices[0];
    if (!selectedOption) {
      reader.status.textContent = 'No English voice is available right now. The text and recorded narration remain available.';
      return;
    }
    if (selectedOption.kind === 'browser' && !selectedOption.voice.localService && !reader.allow.checked) {
      reader.status.textContent = 'Allow the selected browser voice service in settings before sending text to it.';
      reader.settings.open = true;
      return;
    }

    stopRead('Preparing reading…');
    stopExternalMedia();

    reader.items = splitIntoSpeakableChunks(list);
    if (!reader.items.length) {
      reader.status.textContent = 'No eligible visible instructional text was found. Open a section or select a passage.';
      return;
    }
    reader.index = 0;
    reader.playing = true;
    reader.paused = false;
    reader.mode = opts.mode || 'screen';
    reader.activeTarget = opts.target || null;
    reader.activeButton = opts.button || null;
    reader.bar?.setAttribute('data-read-state', 'playing');
    reader.stop.disabled = false;
    const generation = reader.generation;

    const speakWithBrowser = (item, browserVoice) => {
      if (!reader || generation !== reader.generation || !reader.playing || reader.paused) return;
      if (!speech || !window.SpeechSynthesisUtterance) {
        stopRead('Browser speech is not supported here.');
        return;
      }
      releaseAudio();
      releaseSpeech();
      try { speech?.resume?.(); } catch (_) {}
      const spoken = prepareSpeechText(item.text);
      const utterance = new SpeechSynthesisUtterance(spoken);
      activeUtterance = utterance;
      reader.utterance = utterance;
      utterance.lang = browserVoice.lang;
      utterance.voice = browserVoice;
      utterance.rate = +reader.speed.value;
      utterance.onstart = () => {
        if (!reader || generation !== reader.generation || !reader.playing || reader.paused) return;
        clearTimeout(reader.watchdog);
        updateReadingHighlight(item.el, item.text, reader.index, reader.items.length, reader.activeButton);
      };
      utterance.onend = () => {
        if (activeUtterance === utterance) activeUtterance = null;
        if (!reader || generation !== reader.generation || !reader.playing) return;
        if (reader.paused) {
          reader.pendingAdvance = true;
          return;
        }
        reader.index++;
        next();
      };
      utterance.onerror = () => {
        if (activeUtterance === utterance) activeUtterance = null;
        if (reader && generation === reader.generation && reader.playing) {
          stopRead('Speech stopped or was unavailable. Try another voice or continue reading the text.');
        }
      };
      reader.watchdog = setTimeout(() => {
        if (reader && generation === reader.generation && reader.playing) {
          stopRead('The browser did not start speech. Check voice availability or select CARANA Neural Voice.');
        }
      }, 8000);
      speech.speak(utterance);
    };

    const playAudioUrl = async (item, url, revokeOnDone = false) => {
      if (!reader || generation !== reader.generation || !reader.playing || reader.paused) {
        if (revokeOnDone && url) {
          try { URL.revokeObjectURL(url); } catch (_) {}
        }
        return { ok: false, reason: 'stopped' };
      }
      releaseAudio();
      releaseSpeech();
      const audio = new Audio();
      activeAudio = audio;
      if (revokeOnDone) activeAudioUrl = url;
      audio.preload = 'auto';
      audio.src = url;
      audio.playbackRate = +reader.speed.value;
      if ('preservesPitch' in audio) audio.preservesPitch = true;

      return new Promise(resolve => {
        let settled = false;
        const finish = (ok, reason = '') => {
          if (settled) return;
          settled = true;
          clearTimeout(reader?.watchdog);
          if (!ok) {
            try {
              audio.onplay = null;
              audio.onended = null;
              audio.onerror = null;
              audio.pause();
              audio.removeAttribute('src');
              audio.load?.();
            } catch (_) {}
            if (activeAudio === audio) activeAudio = null;
            if (revokeOnDone && activeAudioUrl === url) {
              try { URL.revokeObjectURL(url); } catch (_) {}
              activeAudioUrl = '';
            }
          }
          resolve({ ok, reason });
        };
        audio.onplay = () => {
          if (!reader || generation !== reader.generation || !reader.playing) return finish(false, 'stopped');
          clearTimeout(reader.watchdog);
          updateReadingHighlight(item.el, item.text, reader.index, reader.items.length, reader.activeButton);
        };
        audio.onended = () => {
          if (!reader || generation !== reader.generation || !reader.playing) return finish(false, 'stopped');
          finish(true, '');
        };
        audio.onerror = () => finish(false, 'error');
        reader.watchdog = setTimeout(() => {
          if (reader && generation === reader.generation && audio.paused && audio.currentTime === 0) {
            finish(false, 'timeout');
          }
        }, 10000);
        audio.play().catch(err => {
          const reason = err?.name === 'NotAllowedError' ? 'blocked' : err?.name === 'AbortError' ? 'stopped' : 'error';
          finish(false, reason);
        });
      });
    };

    const next = async () => {
      if (!reader || generation !== reader.generation || !reader.playing) return;
      if (reader.paused) {
        reader.pendingAdvance = true;
        return;
      }
      if (reader.index >= reader.items.length) {
        stopRead('Reading finished. Listening does not change checkpoints.');
        return;
      }
      const item = reader.items[reader.index];
      reader.activeEngine = selectedOption.kind;

      if (selectedOption.kind === 'studio' || selectedOption.kind === 'local-tts') {
        const clipUrl = selectedOption.kind === 'studio' ? studioClipUrl(item.text) : '';
        if (clipUrl) {
          reader.activeMode = 'audio';
          const res = await playAudioUrl(item, clipUrl, false);
          if (!reader || generation !== reader.generation || !reader.playing) return;
          if (reader.paused) {
            if (res.ok) reader.pendingAdvance = true;
            return;
          }
          if (res.ok) {
            reader.index++;
            next();
            return;
          }
          stopRead(
            res.reason === 'blocked'
              ? 'Audio playback was blocked by the browser. Click Play or Read this explanation again.'
              : 'That audio clip could not play cleanly right now. You can continue reading or retry.'
          );
          return;
        }
        // Dynamic/unlisted passage in Studio/Local mode: try live local /api/tts if unlocked, else explicit local fallback only for unlisted static text.
        if (access && localTtsInfo.available) {
          let blobUrl = null;
          try {
            reader.activeMode = 'audio';
            ttsRequest?.abort();
            ttsRequest = new AbortController();
            const voiceId = selectedOption.ttsId || 'kokoro:af_heart';
            blobUrl = await fetchLocalNeuralWav(item.text, voiceId, ttsRequest.signal);
          } catch (_) {
            blobUrl = null;
          }
          if (!reader || generation !== reader.generation || !reader.playing) {
            if (blobUrl) {
              try { URL.revokeObjectURL(blobUrl); } catch (_) {}
            }
            return;
          }
          if (reader.paused) {
            if (blobUrl) {
              try { URL.revokeObjectURL(blobUrl); } catch (_) {}
            }
            reader.pendingAdvance = true;
            return;
          }
          if (blobUrl) {
            const res = await playAudioUrl(item, blobUrl, true);
            if (!reader || generation !== reader.generation || !reader.playing) return;
            if (reader.paused) {
              if (res.ok) reader.pendingAdvance = true;
              return;
            }
            if (res.ok) {
              reader.index++;
              next();
              return;
            }
            stopRead(
              res.reason === 'blocked'
                ? 'Audio playback was blocked by the browser. Click Listen again to play.'
                : 'Audio playback stopped before finishing. You can read the text or retry.'
            );
            return;
          }
          stopRead('Local neural speech service is unavailable or busy right now. Continue reading the text or retry.');
          return;
        }
        if (selectedOption.kind === 'studio' && reader.mode !== 'assistant') {
          const localFallback = reader.voices.find(v => v.kind === 'browser' && v.voice.localService)?.voice;
          if (localFallback) {
            reader.activeMode = 'speech';
            speakWithBrowser(item, localFallback);
            return;
          }
        }
        stopRead('Audio clip unavailable for that custom selection in this browser. Read the screen or use local studio.');
        return;
      }

      reader.activeMode = 'speech';
      speakWithBrowser(item, selectedOption.voice);
    };

    reader.advanceNext = next;
    reader.pendingAdvance = false;
    next();
  }

  function showReader() {
    if (!reader) return;
    reader.area.hidden = !reader.area.hidden;
    reader.toggle.setAttribute('aria-expanded', String(!reader.area.hidden));
    if (!reader.area.hidden) reader.play.focus();
  }

  function dispose() {
    stopRead();
    stopExternalMedia();
    request?.abort();
    request = null;
    if (activeObserver) {
      activeObserver.disconnect();
      activeObserver = null;
    }
    if (panel) {
      panel.close?.();
      panel.remove();
      panel = null;
    }
    document.body.classList.remove('carana-assistant-open');
    current?.events.abort();
    current?.bar.remove();
    current = null;
    reader = null;
    selected = null;
  }

  function isActiveExplanationCard(el) {
    if (!el || !visible(el)) return false;
    if (el.dataset.readExplanation === 'true') return true;
    if (el.matches('details.worked-example[open], details .transcript')) {
      return el.closest('details')?.open && extractBlockText(el).length > 8;
    }
    if (el.matches('#lab-feedback, #priority-result, #priority-compare, #risk-result')) {
      return normalizeKey(el.textContent).length > 8;
    }
    return false;
  }

  function syncInlineReadButtons() {
    if (!current?.root?.isConnected) return;
    const root = current.root;
    const candidates = [
      ...root.querySelectorAll(
        '#vj-result, #vj-mini-feedback, #lab-response, #concept-feedback, #decision-feedback, #lab-feedback, #priority-result, #priority-compare, #risk-result, details.worked-example, .voice-transcript, details .transcript'
      )
    ];

    candidates.forEach((el, idx) => {
      if (!el.dataset.readUid) el.dataset.readUid = 'exp-' + idx + '-' + (el.id || el.className.split(/\s+/)[0] || 'node');
      const uid = el.dataset.readUid;
      let bar = root.querySelector(`.support-inline-bar[data-for="${uid}"]`);
      const active = isActiveExplanationCard(el);

      if (!active) {
        if (bar) bar.remove();
        return;
      }
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'support-ui support-inline-bar';
        bar.dataset.for = uid;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'support-inline-read';
        btn.dataset.defaultLabel = 'Read this explanation';
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = '<span aria-hidden="true">🔊</span> <span>Read this explanation</span>';
        btn.addEventListener('click', () => {
          if (reader?.playing && reader.mode === 'explanation' && reader.activeTarget === el) {
            stopRead('Stopped explanation.');
            return;
          }
          const text = extractBlockText(el, false);
          if (!text) return;
          if (reader?.area?.hidden) {
            reader.area.hidden = false;
            reader.toggle.setAttribute('aria-expanded', 'true');
          }
          readList([{ el, text }], { mode: 'explanation', target: el, button: btn });
        });
        bar.append(btn);
        el.after(bar);
      }
      const btn = bar.querySelector('button');
      if (btn && (!reader?.playing || reader.activeTarget !== el)) {
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = '<span aria-hidden="true">🔊</span> <span>Read this explanation</span>';
      }
    });
  }

  function handleExplanationUpdate(detail) {
    if (!current?.root?.isConnected) return;
    syncInlineReadButtons();
    if (!reader || !reader.playing || reader.paused || detail?.restored) return;

    const target = detail?.target;
    if (reader.mode === 'explanation' && target && reader.activeTarget === target) {
      stopRead(isActiveExplanationCard(target) ? 'Explanation updated. Press Read this explanation to listen.' : 'Explanation cleared.');
      return;
    }

    if (reader.mode === 'screen') {
      const curEl = reader.items[reader.index]?.el;
      if (target && curEl === target) {
        stopRead('Screen content updated. Press Read screen to listen.');
        return;
      }
      const fresh = splitIntoSpeakableChunks(blocks(current.root, reader.includeQuestions));
      if (curEl) {
        const curPos = fresh.findIndex(x => x.el === curEl);
        if (curPos >= 0) {
          reader.items = [reader.items[reader.index], ...fresh.slice(curPos + 1)];
          reader.index = 0;
        }
      }
    }
  }

  function mount(meta) {
    dispose();
    const root = meta.root;
    const heading = root?.querySelector('h1');
    if (!heading) return;

    const key = meta.lessonId + ':' + meta.screenId + ':' + meta.mode;
    if (key !== contextKey) {
      conversation = [];
      contextKey = key;
    }
    current = { ...meta, events: new AbortController() };
    const sig = { signal: current.events.signal };

    const bar = document.createElement('section');
    bar.className = 'support-ui support-studio';
    bar.dataset.readState = 'idle';
    bar.setAttribute('aria-label', 'Learning support');
    bar.innerHTML =
      '<div class="support-entry">' +
      '<button type="button" id="support-listen" aria-expanded="false" aria-controls="support-reader"><span class="support-icon" aria-hidden="true">🔊</span><span>Listen / Read screen</span></button>' +
      '<button type="button" id="support-ask"><span class="support-icon" aria-hidden="true">?</span><span>Ask a question</span></button>' +
      '<span class="support-context">Optional learning support · Studio neural voice & companion</span>' +
      '</div>' +
      '<div id="support-reader" class="support-reader" hidden>' +
      '<div class="support-reader-head"><p class="support-mode">Read Screen · separate from Trainer Narration</p><span class="support-badge" id="read-state-badge">Ready</span></div>' +
      '<div class="support-controls" role="group" aria-label="Read Screen playback controls">' +
      '<button type="button" id="read-play" class="support-primary">Read screen</button>' +
      '<button type="button" id="read-pause" disabled>Pause</button>' +
      '<button type="button" id="read-resume" disabled>Resume</button>' +
      '<button type="button" id="read-stop" disabled>Stop</button>' +
      '<label class="support-speed-label"><span>Speed</span><select id="read-speed" aria-label="Reading speed">' +
      RATES.map(n => '<option ' + (n === 1 ? 'selected' : '') + ' value="' + n + '">' + n + '×</option>').join('') +
      '</select></label></div>' +
      '<details id="read-settings"><summary>Voice and reading options</summary><div class="support-settings-grid">' +
      '<label><span>English voice</span><select id="read-voice"></select></label>' +
      '<label id="read-service-label" class="support-check" hidden><input type="checkbox" id="read-service"><span>Allow this browser voice service; displayed text may leave this device</span></label>' +
      '<p id="read-voice-note" class="support-note"></p>' +
      '<label id="read-question-label" class="support-check" hidden><input type="checkbox" id="read-questions"><span>Include visible questions and answer choices</span></label>' +
      '<div class="support-selection-row"><button type="button" id="read-selection">Read selected passage</button><span>Select a paragraph or section, then choose this action. Private draft text is read only when deliberately selected.</span></div>' +
      '</div></details>' +
      '<p id="read-status" class="support-status" role="status" aria-live="polite">Ready when you choose to listen. Includes visible screen text and revealed diagram explanations.</p>' +
      '</div>';

    const title = heading.closest('.content-title') || (heading.nextElementSibling?.matches('p.lead') ? heading.nextElementSibling : heading);
    title.after(bar);
    current.bar = bar;

    const q = id => bar.querySelector('#' + id);
    reader = {
      bar,
      generation: speechGeneration,
      playing: false,
      paused: false,
      mode: 'screen',
      activeTarget: null,
      activeButton: null,
      includeQuestions: false,
      area: q('support-reader'),
      toggle: q('support-listen'),
      play: q('read-play'),
      pause: q('read-pause'),
      resume: q('read-resume'),
      stop: q('read-stop'),
      badge: q('read-state-badge'),
      status: q('read-status'),
      speed: q('read-speed'),
      voice: q('read-voice'),
      allow: q('read-service'),
      settings: q('read-settings'),
      voices: []
    };

    function refreshVoices() {
      if (!reader) return;
      const previous = reader.voice.value;
      const list = [];

      if (manifestData?.clips && Object.keys(manifestData.clips).length > 0) {
        list.push({
          value: '0:studio',
          kind: 'studio',
          label: 'CARANA Natural Neural · Studio English (Kokoro-82M)'
        });
      }
      if (localTtsInfo.available && Array.isArray(localTtsInfo.voices)) {
        localTtsInfo.voices.forEach((lv, i) => {
          list.push({
            value: '9:' + i + ':' + lv.id,
            kind: 'local-tts',
            ttsId: lv.id,
            label: lv.label + ' · live Mac service'
          });
        });
      }
      const bVoices = filterBrowserVoices();
      bVoices.forEach((v, idx) => {
        list.push({
          value: (list.length ? '1:' : '') + String(idx),
          kind: 'browser',
          voice: v,
          label: v.name + ' · ' + v.lang + (v.localService ? ' · device voice' : ' · browser service')
        });
      });

      reader.voices = list;
      reader.voice.innerHTML = list.length
        ? list.map(opt => '<option value="' + esc(opt.value) + '">' + esc(opt.label) + '</option>').join('')
        : '<option value="">No English voice reported</option>';
      if (previous && list.some(opt => opt.value === previous)) {
        reader.voice.value = previous;
      }

      const chosen = list.find(opt => opt.value === reader.voice.value) || list[0];
      reader.play.disabled = !chosen;
      q('read-service-label').hidden = !chosen || chosen.kind !== 'browser' || chosen.voice.localService;

      if (!chosen) {
        q('read-voice-note').textContent = !speech
          ? 'Read Screen is not supported in this browser environment. Existing narration and text remain available.'
          : 'No English voice is currently reported by this browser. Device voice availability varies.';
      } else if (chosen.kind === 'studio') {
        q('read-voice-note').textContent =
          'Natural studio narration (Kokoro-82M, Apache-2.0) pre-rendered for instructional blocks and dynamic diagrams, with speed control and device-voice fallback for custom selections.';
      } else if (chosen.kind === 'local-tts') {
        q('read-voice-note').textContent = 'Synthesizing live through your authenticated local Mac neural speech service (loopback only).';
      } else {
        q('read-voice-note').textContent =
          'Using browser/device voice fallback (robotic Eloquence & novelty voices excluded). Quality depends on voices installed in your OS settings.';
      }
    }

    refreshVoices();
    loadManifest().then(() => {
      if (reader && current?.root === root) refreshVoices();
    });
    speech?.addEventListener?.('voiceschanged', refreshVoices, sig);

    q('read-question-label').hidden = meta.mode !== 'checkpoint';
    q('support-listen').onclick = showReader;
    q('support-ask').onclick = openAssistant;
    q('read-play').onclick = () => {
      reader.includeQuestions = q('read-questions').checked;
      readList(blocks(root, reader.includeQuestions), { mode: 'screen' });
    };
    q('read-stop').onclick = () => stopRead();

    q('read-pause').onclick = () => {
      if (!reader?.playing || reader.paused) return;
      if (reader.activeMode === 'audio' && activeAudio) {
        activeAudio.pause();
      } else {
        speech?.pause();
      }
      reader.paused = true;
      reader.bar?.setAttribute('data-read-state', 'paused');
      if (reader.badge) reader.badge.textContent = 'Paused';
      reader.status.textContent = 'Paused · resume or restart this passage';
      reader.pause.disabled = true;
      reader.resume.disabled = false;
    };

    q('read-resume').onclick = () => {
      if (!reader?.playing || !reader.paused) return;
      reader.paused = false;
      reader.bar?.setAttribute('data-read-state', 'playing');
      if (reader.badge) reader.badge.textContent = reader.mode === 'explanation' ? 'Explanation' : 'Reading';
      reader.pause.disabled = false;
      reader.resume.disabled = true;
      reader.status.textContent = 'Resuming passage ' + (reader.index + 1) + ' · paragraph focus';
      if (reader.pendingAdvance) {
        reader.pendingAdvance = false;
        reader.index++;
        reader.advanceNext?.();
        return;
      }
      if (reader.activeMode === 'audio' && activeAudio) {
        activeAudio.playbackRate = +reader.speed.value;
        activeAudio.play().catch(() => {});
      } else {
        speech?.resume();
      }
    };

    q('read-speed').onchange = () => {
      if (!reader?.playing) return;
      if (reader.paused) {
        if (reader.activeMode === 'audio' && activeAudio) {
          activeAudio.playbackRate = +reader.speed.value;
          reader.status.textContent = 'Paused · new speed applies when resumed';
        } else {
          reader.status.textContent = 'Paused · new speed applies to the next passage; Resume continues this passage';
        }
      } else if (reader.activeMode === 'audio' && activeAudio) {
        activeAudio.playbackRate = +reader.speed.value;
        reader.status.textContent = `Speed set to ${reader.speed.value}× · passage ${reader.index + 1}`;
      } else {
        readList(reader.items.slice(reader.index), { mode: reader.mode, target: reader.activeTarget, button: reader.activeButton });
      }
    };

    q('read-voice').onchange = () => {
      reader.allow.checked = false;
      refreshVoices();
      stopRead('Voice changed. Restart reading when ready.');
    };

    q('read-selection').onclick = () => {
      selectionSnapshot();
      if (!selected?.text) {
        reader.status.textContent = 'First select a passage within this lesson.';
        return;
      }
      readList([{ el: selected.el, text: selected.text }], { mode: 'selection' });
    };

    root.addEventListener('pointerup', selectionSnapshot, sig);
    root.addEventListener('keyup', selectionSnapshot, sig);
    root.addEventListener('select', selectionSnapshot, sig);
    root.addEventListener('carana:explanation-updated', e => handleExplanationUpdate(e.detail), sig);

    syncInlineReadButtons();
    activeObserver = new MutationObserver(mutations => {
      const relevant = mutations.some(m => {
        const t = m.target;
        if (!(t instanceof Element)) return false;
        if (t.closest('.support-ui, .support-inline-bar')) return false;
        if (m.type === 'attributes' && m.attributeName === 'data-read-current') return false;
        return !!t.closest('#vj-result, #vj-mini-feedback, #lab-response, #concept-feedback, #decision-feedback, .applied-lab, details');
      });
      if (relevant) syncInlineReadButtons();
    });
    activeObserver.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden'] });
  }

  function appendFormattedInline(parent, text) {
    const str = String(text || '');
    const re = /\*\*([^*\n]+)\*\*/g;
    let last = 0;
    let m;
    while ((m = re.exec(str))) {
      if (m.index > last) parent.append(document.createTextNode(str.slice(last, m.index)));
      const strong = document.createElement('strong');
      strong.textContent = m[1];
      parent.append(strong);
      last = m.index + m[0].length;
    }
    if (last < str.length) parent.append(document.createTextNode(str.slice(last)));
  }

  function appendRichParagraphs(container, block) {
    const lines = String(block || '').split('\n').map(l => l.trim()).filter(Boolean);
    let listEl = null;
    let listTag = '';
    const flushList = () => {
      if (listEl) {
        container.append(listEl);
        listEl = null;
        listTag = '';
      }
    };
    for (const line of lines) {
      const bulletMatch = line.match(/^(?:[-*•])\s+(.+)$/);
      const numMatch = !bulletMatch ? line.match(/^\d+[.)]\s+(.+)$/) : null;
      if (bulletMatch || numMatch) {
        const tag = bulletMatch ? 'ul' : 'ol';
        if (!listEl || listTag !== tag) {
          flushList();
          listEl = document.createElement(tag);
          listTag = tag;
        }
        const li = document.createElement('li');
        appendFormattedInline(li, (bulletMatch || numMatch)[1]);
        listEl.append(li);
      } else {
        flushList();
        const p = document.createElement('p');
        appendFormattedInline(p, line);
        container.append(p);
      }
    }
    flushList();
  }

  function formatAssistantBody(container, text) {
    container.innerHTML = '';
    const sections = String(text || '').split(/\n{2,}/);
    for (const part of sections) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (/^Invented teaching example:/i.test(trimmed)) {
        const box = document.createElement('div');
        box.className = 'assistant-callout assistant-callout-example';
        const h = document.createElement('strong');
        h.textContent = 'Invented teaching example';
        box.append(h);
        appendRichParagraphs(box, trimmed.replace(/^Invented teaching example:\s*/i, ''));
        container.append(box);
      } else if (/^Evidence limits:/i.test(trimmed)) {
        const box = document.createElement('div');
        box.className = 'assistant-callout assistant-callout-limits';
        const h = document.createElement('strong');
        h.textContent = 'Evidence limits';
        box.append(h);
        appendRichParagraphs(box, trimmed.replace(/^Evidence limits:\s*/i, ''));
        container.append(box);
      } else {
        appendRichParagraphs(container, trimmed);
      }
    }
  }

  function appendSourcesDetails(article, sources) {
    if (!sources?.length) return;
    const existing = article.querySelector('details');
    if (existing) existing.remove();
    const details = document.createElement('details');
    details.className = 'assistant-sources';
    const summary = document.createElement('summary');
    summary.textContent = 'Review source references (' + sources.length + ')';
    details.append(summary);
    const list = document.createElement('div');
    list.className = 'assistant-sources-list';
    for (const s of sources) {
      const row = document.createElement('p');
      row.textContent = `${s.title} — ${s.source.label} · page(s) ${s.source.pages} · ${s.source.kind}`;
      list.append(row);
    }
    details.append(list);
    article.append(details);
  }

  async function openAssistant() {
    if (!current) return;
    stopRead('Read Screen stopped while you ask a question. Restart it when ready.');
    stopExternalMedia();
    if (panel) {
      panel.showModal();
      return;
    }

    selectionSnapshot();
    const trigger = current.bar.querySelector('#support-ask');
    const activeFocusEl = current.root.querySelector('[data-read-explanation="true"][data-read-title]');
    const focusTitle = activeFocusEl?.dataset?.readTitle || '';

    panel = document.createElement('dialog');
    panel.className = 'support-ui carana-assistant';
    panel.setAttribute('aria-labelledby', 'assistant-title');
    panel.innerHTML =
      '<header class="assistant-brand-bar">' +
      '  <div class="assistant-brand-copy">' +
      '    <div class="assistant-eyebrow-row"><span class="assistant-eyebrow">CARANA LEARNING COMPANION</span><span id="assistant-mode-pill" class="assistant-mode-pill">Checking…</span></div>' +
      '    <h2 id="assistant-title">Interactive Study Guide</h2>' +
      '  </div>' +
      '  <div class="assistant-header-actions">' +
      '    <button type="button" id="assistant-clear" title="Clear current thread">Clear</button>' +
      '    <button type="button" id="assistant-expand" aria-pressed="false">Expand</button>' +
      '    <button type="button" id="assistant-close" aria-label="Close learning assistant">Return to lesson</button>' +
      '  </div>' +
      '</header>' +
      '<div class="assistant-subhead">' +
      '  <p id="assistant-context" class="assistant-context"></p>' +
      '  <div class="assistant-status-row">' +
      '    <p id="assistant-availability" class="support-status assistant-status-pill" role="status">Checking local companion status…</p>' +
      '    <button id="assistant-retry-status" type="button" class="assistant-mini-btn" hidden>Retry</button>' +
      '    <button id="assistant-signout" type="button" class="assistant-mini-btn" hidden>Sign out</button>' +
      '  </div>' +
      '  <div id="assistant-access" class="assistant-access-card" hidden>' +
      '    <label for="assistant-code">Invitation access code <input id="assistant-code" type="password" autocomplete="off" placeholder="Enter your owner or reviewer access code"></label>' +
      '    <button id="assistant-connect" type="button" class="support-primary">Connect</button>' +
      '  </div>' +
      '  <p class="assistant-notice"><strong>Experimental AI · Human Review Pending</strong> — Independent controlled-pilot study aid, not an official UN instrument. Always verify answers against cited curriculum sources; do not enter personal or operational data.</p>' +
      '</div>' +
      '<div class="assistant-prompts" role="group" aria-label="Suggested study prompts">' +
      '  <button type="button" data-prompt="Explain this screen more simply.">Explain this screen</button>' +
      '  <button type="button" data-prompt="Give a clearly invented professional example of this concept.">Practical example</button>' +
      '  <button type="button" data-prompt="What should I remember from this screen?">What to remember</button>' +
      '  <button type="button" data-prompt="Compare the main concepts shown on this screen.">Compare concepts</button>' +
      '  <button type="button" data-prompt="Help me check my reasoning about this screen. Ask me for my reasoning before evaluating it.">Check my reasoning</button>' +
      '  <button type="button" id="assistant-selection" hidden>Ask about selected passage</button>' +
      '</div>' +
      '<div id="assistant-messages" class="assistant-messages" aria-label="Conversation">' +
      '  <div class="assistant-welcome-card">' +
      '    <strong>Focused on your current lesson</strong>' +
      '    <p>Ask for simpler wording, an illustrative policing example, or concept comparisons. Every reply checks authorized CBD curriculum passages and surfaces sources for verification.</p>' +
      '  </div>' +
      '</div>' +
      '<form id="assistant-form" class="assistant-composer">' +
      '  <label for="assistant-question" class="sr-only">Your question</label>' +
      '  <textarea id="assistant-question" rows="2" maxlength="1200" placeholder="Ask about this screen or concept…"></textarea>' +
      '  <div class="assistant-send">' +
      '    <span>Enter sends · Shift+Enter new line</span>' +
      '    <div class="assistant-send-buttons">' +
      '      <button type="button" id="assistant-cancel" hidden>Cancel</button>' +
      '      <button type="submit" id="assistant-send" disabled>Send</button>' +
      '    </div>' +
      '  </div>' +
      '  <p id="assistant-reply-status" role="status" class="support-status"></p>' +
      '</form>';

    panel.querySelector('#assistant-context').textContent =
      'CBD · Lesson ' + current.lessonNumber + ' · ' + current.lessonTitle + ' / ' + current.section + ' / ' + current.screenTitle +
      (focusTitle ? ' · Focus: ' + focusTitle : '') +
      (current.mode === 'checkpoint' ? ' · checkpoint study guidance' : '');

    document.body.append(panel);
    document.body.classList.add('carana-assistant-open');
    const localPanel = panel;

    panel.addEventListener('close', () => {
      if (panel !== localPanel) return;
      request?.abort();
      request = null;
      if (reader?.mode === 'assistant' || ttsRequest) stopRead('Stopped assistant audio when returning to lesson.');
      document.body.classList.remove('carana-assistant-open');
      if (panel === localPanel) {
        panel.remove();
        panel = null;
      }
      if (trigger?.isConnected) trigger.focus();
    });

    panel.addEventListener('click', e => {
      if (e.target === localPanel) localPanel.close();
    });
    panel.querySelector('#assistant-close').onclick = () => panel.close();
    panel.querySelector('#assistant-expand').onclick = e => {
      const expanded = localPanel.classList.toggle('is-expanded');
      e.currentTarget.setAttribute('aria-pressed', String(expanded));
      e.currentTarget.textContent = expanded ? 'Compact' : 'Expand';
    };
    panel.querySelector('#assistant-clear').onclick = () => {
      if (reader?.mode === 'assistant' || ttsRequest) stopRead('Stopped assistant playback.');
      conversation = [];
      const wrap = localPanel.querySelector('#assistant-messages');
      wrap.querySelectorAll('.assistant-message').forEach(m => m.remove());
      const welcome = wrap.querySelector('.assistant-welcome-card');
      if (welcome) welcome.hidden = false;
      localPanel.querySelector('#assistant-reply-status').textContent = 'Conversation cleared.';
    };

    panel.showModal();
    const input = panel.querySelector('#assistant-question');
    input.focus();

    const selectionButton = panel.querySelector('#assistant-selection');
    selectionButton.hidden = !selected?.text || selected.private;
    selectionButton.onclick = () => {
      input.value = 'Explain this selected teaching passage: ' + selected.text.slice(0, 900);
      input.focus();
    };

    function createAssistantListenBtn(article, text) {
      const readBtn = document.createElement('button');
      readBtn.type = 'button';
      readBtn.className = 'assistant-read-reply';
      readBtn.textContent = 'Listen';
      readBtn.onclick = () => {
        if (reader?.playing && reader.mode === 'assistant' && reader.activeTarget === article) {
          stopRead('Stopped assistant playback.');
          return;
        }
        readList([{ el: article, text }], { mode: 'assistant', target: article });
      };
      return readBtn;
    }

    function showMessage(role, text, sources, completed = true) {
      const wrap = panel.querySelector('#assistant-messages');
      const welcome = wrap.querySelector('.assistant-welcome-card');
      if (welcome) welcome.hidden = true;

      const article = document.createElement('article');
      article.className = 'assistant-message ' + role;
      const head = document.createElement('div');
      head.className = 'assistant-msg-head';
      const label = document.createElement('strong');
      label.textContent = role === 'user' ? 'Your question' : 'CARANA Companion';
      head.append(label);

      if (role === 'assistant' && completed && text && (localTtsInfo.available || speech?.getVoices?.().length)) {
        head.append(createAssistantListenBtn(article, text));
      }

      const body = document.createElement('div');
      body.className = 'assistant-response';
      if (role === 'assistant') formatAssistantBody(body, text);
      else body.textContent = text;

      article.append(head, body);
      appendSourcesDetails(article, sources);
      wrap.append(article);
      wrap.scrollTop = wrap.scrollHeight;
      return { article, body };
    }

    for (const m of conversation) showMessage(m.role, m.text, m.sources, true);

    let available = false;
    let statusMeta = null;
    const modePill = panel.querySelector('#assistant-mode-pill');
    const availEl = panel.querySelector('#assistant-availability');
    const accessBox = panel.querySelector('#assistant-access');
    const retryStatusBtn = panel.querySelector('#assistant-retry-status');
    const signoutBtn = panel.querySelector('#assistant-signout');
    const sendBtn = panel.querySelector('#assistant-send');

    function renderConnectedBanner(status) {
      const isSim = status.provider === 'simulated-test';
      const isHold = !status.qualification || status.qualification === 'not-qualified';
      modePill.textContent = isSim
        ? 'Simulated Test'
        : isHold
          ? (status.remoteOwnerPreview ? 'Owner Preview · HOLD' : 'Experimental · HOLD')
          : 'Experimental AI · Review Pending';
      modePill.dataset.state = isSim ? 'simulated' : 'connected';
      availEl.dataset.state = isSim ? 'simulated' : 'connected';
      const prefix = accessUser ? `${accessUser.displayName} (${accessUser.role}) · ` : status.remoteOwnerPreview ? 'Invitation only · ' : '';
      const queueNote = status.busy ? ` · busy (${status.queueDepth || 0} queued)` : '';
      availEl.textContent = isSim
        ? 'Simulated test provider · not AI: ' + status.model
        : prefix +
          (isHold
            ? 'Experimental local model · NOT QUALIFIED for teaching: '
            : 'Experimental AI (human review pending): ') +
          status.model +
          queueNote;
    }

    async function refreshStatus() {
      retryStatusBtn.hidden = true;
      try {
        const response = await fetch('/api/tutor/status', { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw Error('Unavailable');
        const status = await response.json();
        if (panel !== localPanel) return;
        if (status.mode !== 'local-pilot') throw Error('Unavailable');
        statusMeta = status;
        available = !!status.connected;
        if (status.tts?.available) {
          localTtsInfo = status.tts;
        }
        if (status.connected) {
          renderConnectedBanner(status);
        } else {
          modePill.textContent = status.pilotDisabled ? 'Pilot Paused' : 'Offline';
          modePill.dataset.state = 'offline';
          availEl.dataset.state = 'offline';
          availEl.textContent = status.pilotDisabled
            ? 'The invited pilot is currently paused by the administrator. Course navigation continues offline.'
            : 'Local model is offline or starting up. The course remains available.';
          retryStatusBtn.hidden = false;
        }
        accessBox.hidden = !status.requiresAccess || (!!access && available);
        signoutBtn.hidden = !(!!access && available && status.requiresAccess);
        sendBtn.disabled = !status.connected || !access;
      } catch (_) {
        if (panel === localPanel) {
          statusMeta = null;
          available = false;
          modePill.textContent = 'Public Preview';
          modePill.dataset.state = 'offline';
          availEl.dataset.state = 'offline';
          availEl.textContent =
            'Not connected in this preview. You can continue the lesson and use Read Screen. Live AI is available only in authorized pilot environments.';
          retryStatusBtn.hidden = false;
          accessBox.hidden = true;
          signoutBtn.hidden = true;
          sendBtn.disabled = true;
        }
      }
    }

    await refreshStatus();
    retryStatusBtn.onclick = refreshStatus;
    signoutBtn.onclick = () => {
      if (reader?.mode === 'assistant' || ttsRequest) stopRead('Stopped assistant playback.');
      access = '';
      accessUser = null;
      sendBtn.disabled = true;
      signoutBtn.hidden = true;
      accessBox.hidden = !available;
      if (statusMeta?.connected) renderConnectedBanner(statusMeta);
      localPanel.querySelector('#assistant-reply-status').textContent = 'Signed out. Enter an access code to reconnect.';
      localPanel.querySelector('#assistant-code')?.focus();
    };

    if (panel !== localPanel) return;

    const codeInput = panel.querySelector('#assistant-code');
    const connectBtn = panel.querySelector('#assistant-connect');
    const triggerConnect = async () => {
      const candidate = codeInput.value.trim();
      if (!candidate || !available) {
        panel.querySelector('#assistant-reply-status').textContent = available
          ? 'Enter your invitation or pilot access code first.'
          : 'Wait until the AI service shows connected before signing in.';
        return;
      }
      if (statusMeta?.authEndpoint) {
        connectBtn.disabled = true;
        codeInput.disabled = true;
        panel.querySelector('#assistant-reply-status').textContent = 'Verifying access code with server…';
        try {
          const authRes = await fetch('/api/tutor/auth', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + candidate, 'Content-Type': 'application/json' },
            body: '{}',
            signal: AbortSignal.timeout(8000)
          });
          const data = await authRes.json().catch(() => ({}));
          if (!authRes.ok || !data.authenticated) {
            access = '';
            accessUser = null;
            codeInput.value = '';
            sendBtn.disabled = true;
            panel.querySelector('#assistant-reply-status').textContent = data.message || 'Access code was not accepted.';
            codeInput.disabled = false;
            connectBtn.disabled = false;
            codeInput.focus();
            return;
          }
          access = candidate;
          accessUser = data;
          codeInput.value = '';
          accessBox.hidden = true;
          signoutBtn.hidden = false;
          sendBtn.disabled = !available || !access;
          renderConnectedBanner(statusMeta);
          panel.querySelector('#assistant-reply-status').textContent = 'Signed in as ' + data.displayName + '.';
          input.focus();
        } catch (_) {
          panel.querySelector('#assistant-reply-status').textContent = 'Could not reach the authentication server. Retry shortly.';
        } finally {
          connectBtn.disabled = false;
          codeInput.disabled = false;
        }
      } else {
        access = candidate;
        accessUser = null;
        codeInput.value = '';
        sendBtn.disabled = !available || !access;
        accessBox.hidden = true;
        signoutBtn.hidden = false;
        panel.querySelector('#assistant-reply-status').textContent = 'Access code ready.';
        input.focus();
      }
    };
    connectBtn.onclick = triggerConnect;
    codeInput.onkeydown = e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerConnect();
      }
    };

    async function send(event) {
      event.preventDefault();
      if (!available || !access || request) return;
      const question = input.value.trim();
      if (!question) return;
      if (reader?.mode === 'assistant' || ttsRequest) stopRead('Stopped previous assistant playback.');
      input.value = '';
      const priorTurns = conversation
        .slice(-4)
        .filter(item => item && (item.role === 'user' || item.role === 'assistant') && item.text)
        .map(item => ({ role: item.role, text: String(item.text).slice(0, 750) }));
      conversation.push({ role: 'user', text: question });
      showMessage('user', question, null, true);

      const { article, body: reply } = showMessage('assistant', '', null, false);
      const status = panel.querySelector('#assistant-reply-status');
      const activeRequest = new AbortController();
      request = activeRequest;
      sendBtn.disabled = true;
      panel.querySelector('#assistant-cancel').hidden = false;
      status.textContent = 'Finding relevant course material…';

      let text = '';
      let sources = [];
      const setSources = nextSources => {
        sources = Array.isArray(nextSources) ? nextSources : [];
        const existing = article.querySelector('.assistant-sources');
        if (existing) existing.remove();
        appendSourcesDetails(article, sources);
      };
      try {
        const bodyPayload = {
          question,
          context: { lessonId: current.lessonId, screenId: current.screenId, mode: current.mode }
        };
        if (priorTurns.length) bodyPayload.history = priorTurns;
        const response = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + access },
          body: JSON.stringify(bodyPayload),
          signal: activeRequest.signal
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          if (response.status === 401 || response.status === 403) {
            access = '';
            accessUser = null;
            accessBox.hidden = false;
            signoutBtn.hidden = true;
          }
          if (response.status === 503) retryStatusBtn.hidden = false;
          throw Error(error.message || 'The local service could not complete this question.');
        }

        let buffer = '';
        const decoder = new TextDecoder();
        for await (const chunk of response.body) {
          buffer += decoder.decode(chunk, { stream: true });
          let n;
          while ((n = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, n);
            buffer = buffer.slice(n + 1);
            if (!line.trim()) continue;
            const row = JSON.parse(line);
            if (row.type === 'queued') {
              status.dataset.queue = 'true';
              status.textContent =
                'Queued (position ' + row.position + (row.queueLength > 1 ? ' of ' + row.queueLength : '') + ') · waiting for current question to finish…';
            }
            if (row.type === 'started') {
              delete status.dataset.queue;
              status.textContent = 'Your turn — preparing grounded explanation…';
            }
            if (row.type === 'stage') {
              delete status.dataset.queue;
              if (row.text) status.textContent = row.text;
            }
            if (row.type === 'segment' && row.segment === 'answer') {
              delete status.dataset.queue;
              text = row.text || '';
              formatAssistantBody(reply, text);
              if (row.sources) setSources(row.sources);
              const wrap = panel.querySelector('#assistant-messages');
              wrap.scrollTop = wrap.scrollHeight;
              status.textContent = 'Showing answer · checking teaching example and sources…';
            }
            if (row.type === 'content') {
              delete status.dataset.queue;
              text += row.text;
              formatAssistantBody(reply, text);
              const wrap = panel.querySelector('#assistant-messages');
              wrap.scrollTop = wrap.scrollHeight;
              status.textContent = 'Showing source-checked guidance…';
            }
            if (row.type === 'done') {
              setSources(row.sources || sources);
              status.textContent =
                row.provider === 'simulated-test'
                  ? 'Simulated test response · interface verification only'
                  : row.kind === 'ai'
                    ? 'Reply ready · real local model · review its sources'
                    : 'Source-based study guidance · no model answer key';
            }
            if (row.type === 'error') throw Error(row.message);
          }
        }
        if (!text) throw Error('No model reply was received.');
        if (!article.querySelector('.assistant-sources')) setSources(sources);
        const msgHead = article.querySelector('.assistant-msg-head');
        if (msgHead && !msgHead.querySelector('.assistant-read-reply') && (localTtsInfo.available || speech?.getVoices?.().length)) {
          msgHead.append(createAssistantListenBtn(article, text));
        }
        conversation.push({ role: 'assistant', text, sources });
        conversation = conversation.slice(-12);
      } catch (e) {
        if (panel !== localPanel) return;
        status.textContent =
          e.name === 'AbortError'
            ? 'Reply cancelled. Your place in the lesson is unchanged.'
            : e.message;
        if (!text) reply.textContent = e.name === 'AbortError' ? 'Cancelled.' : 'No AI response was supplied.';
      } finally {
        if (request === activeRequest) request = null;
        if (panel === localPanel) {
          sendBtn.disabled = !available || !access;
          panel.querySelector('#assistant-cancel').hidden = true;
        }
      }
    }

    panel.querySelector('#assistant-form').onsubmit = send;
    panel.querySelector('#assistant-cancel').onclick = () => request?.abort();
    input.onkeydown = e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        panel.querySelector('#assistant-form').requestSubmit();
      }
    };
    panel.querySelectorAll('[data-prompt]').forEach(b => {
      b.onclick = () => {
        input.value = b.dataset.prompt;
        input.focus();
      };
    });
  }

  document.addEventListener(
    'play',
    e => {
      if (e.target instanceof HTMLMediaElement && e.target !== activeAudio) {
        stopRead('Trainer Narration is playing. Read Screen has stopped.');
      }
    },
    true
  );

  window.addEventListener('pagehide', () => {
    stopRead();
    stopExternalMedia();
    request?.abort();
  });

  window.addEventListener('hashchange', () => {
    stopRead();
    stopExternalMedia();
  });

  window.addEventListener('popstate', () => {
    stopRead();
    stopExternalMedia();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRead('Reading stopped while this page is in the background.');
      stopExternalMedia();
    }
  });

  window.CARANA_SUPPORT = {
    mount,
    dispose,
    blocks,
    stop: stopRead,
    prepareSpeechText,
    sha256Hex,
    get isPlaying() {
      return !!(reader?.playing && !reader.paused);
    },
    get context() {
      return current ? { lessonId: current.lessonId, screenId: current.screenId, mode: current.mode } : null;
    }
  };
})();
