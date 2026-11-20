'use strict';

function silencePageScript() {
  if (window.__caranaTestAudioSilenced) return;
  window.__caranaTestAudioSilenced = true;

  if (typeof HTMLMediaElement !== 'undefined' && HTMLMediaElement.prototype.play) {
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function playSilenced() {
      try {
        this.muted = true;
        this.volume = 0;
      } catch (_) {}
      return nativePlay.call(this);
    };
  }

  if (typeof SpeechSynthesis !== 'undefined' && SpeechSynthesis.prototype) {
    let activeTimer = null;
    let endTimer = null;
    let isSpeaking = false;
    let isPaused = false;
    let pendingResumeUtterance = null;
    const clearTimers = () => {
      if (activeTimer) clearTimeout(activeTimer);
      if (endTimer) clearTimeout(endTimer);
      activeTimer = null;
      endTimer = null;
      pendingResumeUtterance = null;
    };
    const emit = (utt, type) => {
      let ev;
      try {
        ev = new SpeechSynthesisEvent(type, { utterance: utt });
      } catch (_) {
        ev = new Event(type);
      }
      if (type === 'start' && typeof utt.onstart === 'function') {
        try { utt.onstart(ev); } catch (_) {}
      }
      if (type === 'end' && typeof utt.onend === 'function') {
        try { utt.onend(ev); } catch (_) {}
      }
      try { utt.dispatchEvent?.(ev); } catch (_) {}
    };
    const scheduleEnd = utt => {
      endTimer = setTimeout(() => {
        endTimer = null;
        isSpeaking = false;
        isPaused = false;
        emit(utt, 'end');
      }, 160);
    };
    SpeechSynthesis.prototype.speak = function speakSilenced(utt) {
      clearTimers();
      isSpeaking = true;
      isPaused = false;
      activeTimer = setTimeout(() => {
        activeTimer = null;
        if (!isSpeaking) return;
        emit(utt, 'start');
        if (isPaused) {
          pendingResumeUtterance = utt;
          return;
        }
        scheduleEnd(utt);
      }, 20);
    };
    SpeechSynthesis.prototype.cancel = function cancelSilenced() {
      clearTimers();
      isSpeaking = false;
      isPaused = false;
    };
    SpeechSynthesis.prototype.pause = function pauseSilenced() {
      if (!isSpeaking) return;
      isPaused = true;
      if (endTimer) {
        clearTimeout(endTimer);
        endTimer = null;
      }
    };
    SpeechSynthesis.prototype.resume = function resumeSilenced() {
      if (!isPaused) return;
      isPaused = false;
      if (pendingResumeUtterance) {
        const utt = pendingResumeUtterance;
        pendingResumeUtterance = null;
        scheduleEnd(utt);
      }
    };
    try {
      Object.defineProperty(SpeechSynthesis.prototype, 'speaking', { configurable: true, get: () => isSpeaking });
      Object.defineProperty(SpeechSynthesis.prototype, 'paused', { configurable: true, get: () => isPaused });
    } catch (_) {}
  }
}

async function silenceContextAudio(context) {
  if (process.env.CARANA_AUDIBLE_TEST === '1') return context;
  await context.addInitScript(silencePageScript);
  return context;
}

async function launchMutedBrowser(engine, opts = {}) {
  const audible = process.env.CARANA_AUDIBLE_TEST === '1';
  const launchOpts = { ...opts };
  if (!audible && engine && typeof engine.name === 'function' && engine.name() === 'chromium') {
    const args = Array.isArray(launchOpts.args) ? [...launchOpts.args] : [];
    if (!args.includes('--mute-audio')) args.push('--mute-audio');
    launchOpts.args = args;
  }
  const browser = await engine.launch(launchOpts);
  if (audible) return browser;

  const origNewContext = browser.newContext.bind(browser);
  browser.newContext = async function mutedNewContext(ctxOpts) {
    const ctx = await origNewContext(ctxOpts);
    await silenceContextAudio(ctx);
    return ctx;
  };
  const origNewPage = browser.newPage.bind(browser);
  browser.newPage = async function mutedNewPage(pageOpts) {
    const page = await origNewPage(pageOpts);
    await page.context().addInitScript(silencePageScript);
    await page.addInitScript(silencePageScript);
    return page;
  };
  return browser;
}

module.exports = { launchMutedBrowser, silenceContextAudio, silencePageScript };
