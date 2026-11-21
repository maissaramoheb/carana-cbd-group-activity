/* CARANA shared trilingual localization runtime (en | fr-FR | ar).
 * Extensible to additional UN languages without duplicating apps or engines.
 * Preserves canonical English semantics, storage keys, and answer validation.
 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CARANA_I18N = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  const STORAGE_KEY = 'carana_lang_v1';
  const LOCALES = {
    en: { code: 'en', bcp47: 'en', dir: 'ltr', short: 'EN', label: 'English' },
    'fr-FR': { code: 'fr-FR', bcp47: 'fr-FR', dir: 'ltr', short: 'FR', label: 'Français' },
    ar: { code: 'ar', bcp47: 'ar', dir: 'rtl', short: 'AR', label: 'العربية' }
  };

  const VALID_SURFACES = new Set(['ui', 'course-l1', 'lessons-2-6', 'workbenches']);
  const packs = new Map();
  const inflight = new Map();
  const listeners = new Set();
  const registeredSurfaces = new Set(['ui']);
  const wbTextSnapshots = typeof WeakMap === 'function' ? new WeakMap() : null;
  const wbAttrSnapshots = typeof WeakMap === 'function' ? new WeakMap() : null;

  let currentLang = 'en';
  let fallbackNoticeLang = '';
  let lastError = '';
  let languageRevision = 0;
  let pendingLang = 'en';

  function normalizeLang(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const clean = raw.trim().toLowerCase();
    if (clean === 'en' || clean.startsWith('en-')) return 'en';
    if (clean === 'fr' || clean === 'fr-fr' || clean === 'fr_fr' || clean.startsWith('fr-')) return 'fr-FR';
    if (clean === 'ar' || clean.startsWith('ar-') || clean.startsWith('ar_')) return 'ar';
    return null;
  }

  function resolveLocaleMeta(code) {
    return LOCALES[normalizeLang(code) || 'en'] || LOCALES.en;
  }

  function detectBaseUrl() {
    if (typeof document === 'undefined') return '';
    try {
      const scripts = document.querySelectorAll('script[src]');
      for (let i = scripts.length - 1; i >= 0; i--) {
        const src = scripts[i].getAttribute('src') || '';
        if (/(?:^|\/)i18n\.js(?:\?|$)/.test(src)) {
          return new URL('../locales/', new URL(src, document.baseURI)).href;
        }
      }
      const p = String((typeof location !== 'undefined' && location.pathname) || '/');
      if (/\/(?:course|platform)\//.test(p)) return '../locales/';
      return './locales/';
    } catch (_) {
      return './locales/';
    }
  }

  const LOCALES_BASE = detectBaseUrl();

  function safeReadStorage() {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    } catch (_) {
      return null;
    }
  }

  function safeWriteStorage(code) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, code);
      return true;
    } catch (_) {
      return false;
    }
  }

  function detectInitialLang() {
    try {
      if (typeof location !== 'undefined' && location.search) {
        const sp = new URLSearchParams(location.search);
        const qp = normalizeLang(sp.get('lang'));
        if (qp) {
          safeWriteStorage(qp);
          return qp;
        }
      }
    } catch (_) {}
    const stored = normalizeLang(safeReadStorage());
    return stored || 'en';
  }

  function ensureReleaseNotice() {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function' ||
        !document.body || typeof document.body.insertBefore !== 'function') return;
    let notice = document.getElementById('carana-release-notice');
    if (!notice) {
      notice = document.createElement('aside');
      notice.id = 'carana-release-notice';
      notice.className = 'carana-release-notice';
      notice.setAttribute('role', 'note');
      notice.setAttribute('data-i18n-skip', '');
      document.body.insertBefore(notice, document.body.firstChild);
    }
    const messages = {
      en: 'French and Arabic are educational adaptations pending institutional validation. Some narration remains under development.',
      'fr-FR': 'Les versions française et arabe sont des adaptations pédagogiques en attente de validation institutionnelle. Certains contenus audio sont encore en développement.',
      ar: 'النسختان الفرنسية والعربية تكييفات تعليمية قيد التحقق المؤسسي. بعض التسجيلات الصوتية لا تزال قيد التطوير.'
    };
    notice.textContent = messages[currentLang] || messages.en;
    notice.setAttribute('lang', currentLang);
    notice.setAttribute('dir', resolveLocaleMeta(currentLang).dir);
  }

  function applyDocumentAttributes(code) {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const meta = resolveLocaleMeta(code);
    const html = document.documentElement;
    html.setAttribute('lang', meta.bcp47);
    html.setAttribute('dir', meta.dir);
    html.dataset.lang = meta.code;
    html.dataset.dir = meta.dir;
    ensureReleaseNotice();
  }

  currentLang = detectInitialLang();
  pendingLang = currentLang;
  applyDocumentAttributes(currentLang);
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', ensureReleaseNotice);
  }

  function esc(x) {
    return String(x == null ? '' : x)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveKey(obj, path) {
    if (!obj || typeof path !== 'string') return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== 'object') return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function formatVars(str, vars) {
    if (typeof str !== 'string' || !vars) return str;
    return str.replace(/\{([A-Za-z0-9_.-]+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vars, k) && vars[k] !== undefined && vars[k] !== null
        ? String(vars[k])
        : m;
    });
  }

  function getPack(surface, lang) {
    const code = normalizeLang(lang || currentLang) || 'en';
    if (code === 'en') return null;
    const byLang = packs.get(code);
    return byLang ? byLang.get(surface) || null : null;
  }

  function t(key, vars, fallback) {
    const code = currentLang;
    if (code !== 'en') {
      const uiPack = getPack('ui', code);
      const val = resolveKey(uiPack, key);
      if (typeof val === 'string') return formatVars(val, vars);
    }
    const base = fallback !== undefined ? String(fallback) : String(key || '');
    return formatVars(base, vars);
  }

  function h(key, vars, fallback) {
    return esc(t(key, vars, fallback));
  }

  function rawList(key, fallback) {
    if (currentLang !== 'en') {
      const val = resolveKey(getPack('ui', currentLang), key);
      if (Array.isArray(val)) return val;
    }
    return Array.isArray(fallback) ? fallback : [];
  }

  function tw(enStr, vars) {
    if (typeof enStr !== 'string') return enStr == null ? '' : String(enStr);
    if (currentLang === 'en') return formatVars(enStr, vars);
    const wb = getPack('workbenches', currentLang);
    if (wb) {
      const fromStrings = wb.strings && Object.prototype.hasOwnProperty.call(wb.strings, enStr) ? wb.strings[enStr] : undefined;
      if (typeof fromStrings === 'string') return formatVars(fromStrings, vars);
      const fromDom = wb.dom && Object.prototype.hasOwnProperty.call(wb.dom, enStr) ? wb.dom[enStr] : undefined;
      if (typeof fromDom === 'string') return formatVars(fromDom, vars);
    }
    return formatVars(enStr, vars);
  }

  function bdi(text) {
    const safe = esc(text);
    return resolveLocaleMeta(currentLang).dir === 'rtl' ? '<bdi dir="ltr">' + safe + '</bdi>' : safe;
  }

  function loadPack(surface, lang) {
    const code = normalizeLang(lang || currentLang) || 'en';
    if (code === 'en' || !VALID_SURFACES.has(surface)) return Promise.resolve(null);
    const existing = getPack(surface, code);
    if (existing) return Promise.resolve(existing);
    const cacheKey = code + ':' + surface;
    if (inflight.has(cacheKey)) return inflight.get(cacheKey);
    if (typeof fetch !== 'function') return Promise.resolve(null);

    const url = LOCALES_BASE + encodeURIComponent(code) + '/' + encodeURIComponent(surface) + '.json';
    const promise = fetch(url, { cache: 'default' })
      .then(function (res) {
        if (!res.ok) throw new Error('Locale HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!packs.has(code)) packs.set(code, new Map());
        packs.get(code).set(surface, data);
        return data;
      })
      .catch(function (err) {
        if (code === pendingLang) {
          fallbackNoticeLang = code;
          lastError = err && err.message ? err.message : 'Locale load error';
        }
        return null;
      })
      .finally(function () {
        inflight.delete(cacheKey);
      });
    inflight.set(cacheKey, promise);
    return promise;
  }

  function registerSurfaces(surfaces) {
    const list = Array.isArray(surfaces) ? surfaces : [surfaces];
    for (let i = 0; i < list.length; i++) {
      if (VALID_SURFACES.has(list[i])) registeredSurfaces.add(list[i]);
    }
  }

  function ready(surfaces, lang) {
    if (surfaces) registerSurfaces(surfaces);
    const code = normalizeLang(lang || currentLang) || 'en';
    if (code === 'en') return Promise.resolve({ lang: 'en', ok: true });
    const list = Array.from(registeredSurfaces);
    return Promise.all(list.map(function (s) { return loadPack(s, code); })).then(function (loaded) {
      const ok = loaded.every(Boolean);
      if (code === pendingLang) {
        fallbackNoticeLang = ok ? '' : code;
        lastError = ok ? '' : (lastError || 'Locale load error');
      }
      return { lang: code, ok: ok };
    });
  }

  function applyStaticDom(rootNode) {
    ensureReleaseNotice();
    if (typeof document === 'undefined') return;
    const scope = rootNode || document;
    const elements = scope.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title]');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (el.dataset.i18n) {
        if (!Object.prototype.hasOwnProperty.call(el.dataset, 'i18nEn')) el.dataset.i18nEn = el.textContent;
        el.textContent = t(el.dataset.i18n, null, el.dataset.i18nEn);
      }
      if (el.dataset.i18nHtml) {
        if (!Object.prototype.hasOwnProperty.call(el.dataset, 'i18nHtmlEn')) el.dataset.i18nHtmlEn = el.innerHTML;
        const nextHtml = t(el.dataset.i18nHtml, null, '');
        el.innerHTML = nextHtml || el.dataset.i18nHtmlEn;
      }
      if (el.dataset.i18nPlaceholder) {
        if (!Object.prototype.hasOwnProperty.call(el.dataset, 'i18nPlaceholderEn')) {
          el.dataset.i18nPlaceholderEn = el.getAttribute('placeholder') || '';
        }
        el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder, null, el.dataset.i18nPlaceholderEn));
      }
      if (el.dataset.i18nAriaLabel) {
        if (!Object.prototype.hasOwnProperty.call(el.dataset, 'i18nAriaLabelEn')) {
          el.dataset.i18nAriaLabelEn = el.getAttribute('aria-label') || '';
        }
        el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel, null, el.dataset.i18nAriaLabelEn));
      }
      if (el.dataset.i18nTitle) {
        if (!Object.prototype.hasOwnProperty.call(el.dataset, 'i18nTitleEn')) {
          el.dataset.i18nTitleEn = el.getAttribute('title') || '';
        }
        el.setAttribute('title', t(el.dataset.i18nTitle, null, el.dataset.i18nTitleEn));
      }
    }
    applyBidiInputs(scope);
  }

  function applyBidiInputs(rootNode) {
    if (typeof document === 'undefined') return;
    const scope = rootNode || document;
    const inputs = scope.querySelectorAll('input[type="text"], input[type="search"], input:not([type]), textarea, [data-learner-text]');
    for (let i = 0; i < inputs.length; i++) {
      if (!inputs[i].hasAttribute('dir')) inputs[i].setAttribute('dir', 'auto');
    }
  }

  function normalizeWs(s) {
    return String(s).replace(/\s+/g, ' ').trim();
  }

  function lookupWb(wbPack, exact) {
    if (!wbPack || !exact) return null;
    const norm = normalizeWs(exact);
    if (!norm) return null;
    if (wbPack.dom && Object.prototype.hasOwnProperty.call(wbPack.dom, exact)) return wbPack.dom[exact];
    if (wbPack.dom && Object.prototype.hasOwnProperty.call(wbPack.dom, norm)) return wbPack.dom[norm];
    if (wbPack.strings && Object.prototype.hasOwnProperty.call(wbPack.strings, norm)) return wbPack.strings[norm];
    return null;
  }

  function translateWorkbenchDom(rootNode) {
    if (typeof document === 'undefined' || !wbTextSnapshots || !wbAttrSnapshots) return;
    const scope = rootNode || document.body;
    if (!scope) return;
    const wbPack = currentLang === 'en' ? null : getPack('workbenches', currentLang);

    // Preserve exact document title snapshot
    if (typeof document.title === 'string') {
      if (!document.documentElement.dataset.wbTitleEn) {
        document.documentElement.dataset.wbTitleEn = document.title;
      }
      const origTitle = document.documentElement.dataset.wbTitleEn;
      document.title = currentLang === 'en' ? origTitle : (lookupWb(wbPack, origTitle) || origTitle);
    }

    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if (p.closest('.carana-lang-switch,[data-i18n-skip],#scenarioDrawerList,#glossaryList,[data-learner-text]')) {
          return NodeFilter.FILTER_REJECT;
        }
        return normalizeWs(node.nodeValue).length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);
    for (let i = 0; i < textNodes.length; i++) {
      const tn = textNodes[i];
      if (!wbTextSnapshots.has(tn)) {
        wbTextSnapshots.set(tn, tn.nodeValue);
      }
      const orig = wbTextSnapshots.get(tn);
      if (currentLang === 'en') {
        if (tn.nodeValue !== orig) tn.nodeValue = orig;
        continue;
      }
      const leadMatch = orig.match(/^\s*/)[0];
      const trailMatch = orig.match(/\s*$/)[0];
      const translated = lookupWb(wbPack, orig);
      if (typeof translated === 'string') {
        tn.nodeValue = leadMatch + translated + trailMatch;
      }
    }

    const attrTargets = scope.querySelectorAll('[placeholder], [aria-label], [title], input[type="button"], input[type="submit"]');
    const attrs = ['placeholder', 'aria-label', 'title'];
    for (let i = 0; i < attrTargets.length; i++) {
      const el = attrTargets[i];
      if (el.closest('.carana-lang-switch,[data-i18n-skip]')) continue;
      let snap = wbAttrSnapshots.get(el);
      if (!snap) {
        snap = {};
        for (let j = 0; j < attrs.length; j++) {
          if (el.hasAttribute(attrs[j])) snap[attrs[j]] = el.getAttribute(attrs[j]);
        }
        wbAttrSnapshots.set(el, snap);
      }
      for (const a of Object.keys(snap)) {
        const origAttr = snap[a];
        if (currentLang === 'en') {
          el.setAttribute(a, origAttr);
        } else {
          const tr = lookupWb(wbPack, origAttr);
          el.setAttribute(a, typeof tr === 'string' ? tr : origAttr);
        }
      }
    }
    applyBidiInputs(scope);
  }

  function stopAllAudioForSwitch() {
    try {
      if (root.CARANA_SUPPORT && typeof root.CARANA_SUPPORT.stop === 'function') {
        root.CARANA_SUPPORT.stop(t('audio.stoppedOnSwitch', null, 'Playback stopped when switching language.'));
      }
    } catch (_) {}
    try {
      if (root.speechSynthesis && typeof root.speechSynthesis.cancel === 'function') {
        root.speechSynthesis.cancel();
      }
    } catch (_) {}
    if (typeof document !== 'undefined') {
      try {
        const media = document.querySelectorAll('audio, video');
        for (let i = 0; i < media.length; i++) {
          if (!media[i].paused && typeof media[i].pause === 'function') media[i].pause();
        }
      } catch (_) {}
    }
  }

  function refreshSwitchers() {
    if (typeof document === 'undefined') return;
    const groups = document.querySelectorAll('.carana-lang-switch');
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      group.setAttribute('aria-label', t('lang.selectorLabel', null, 'Interface language'));
      const buttons = group.querySelectorAll('[data-lang-choice]');
      for (let j = 0; j < buttons.length; j++) {
        const btn = buttons[j];
        const code = btn.getAttribute('data-lang-choice');
        const active = code === currentLang;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.classList.toggle('is-active', active);
      }
    }
  }

  function createSwitcherElement(opts) {
    if (typeof document === 'undefined') return null;
    const options = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'carana-lang-switch' + (options.variant ? ' is-' + options.variant : '');
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', t('lang.selectorLabel', null, 'Interface language'));
    const keys = Object.keys(LOCALES);
    for (let i = 0; i < keys.length; i++) {
      const meta = LOCALES[keys[i]];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'carana-lang-btn' + (meta.code === currentLang ? ' is-active' : '');
      btn.setAttribute('data-lang-choice', meta.code);
      btn.setAttribute('aria-pressed', meta.code === currentLang ? 'true' : 'false');
      btn.setAttribute('lang', meta.bcp47);
      btn.textContent = meta.label;
      btn.addEventListener('click', function () {
        setLanguage(meta.code);
      });
      wrap.appendChild(btn);
    }
    return wrap;
  }

  function mountSwitcher(target, opts) {
    if (typeof document === 'undefined') return null;
    const host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) return null;
    const existing = host.querySelector('.carana-lang-switch');
    if (existing) {
      refreshSwitchers();
      return existing;
    }
    const el = createSwitcherElement(opts);
    if (opts && opts.prepend) host.prepend(el);
    else host.appendChild(el);
    return el;
  }

  function setLanguage(code) {
    const next = normalizeLang(code) || 'en';
    // Every choice cancels older requests, including a return to the active language.
    const revision = ++languageRevision;
    pendingLang = next;
    if (next === currentLang) {
      fallbackNoticeLang = '';
      lastError = '';
      refreshSwitchers();
      return Promise.resolve({ lang: currentLang, changed: false });
    }
    if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
      root.dispatchEvent(new root.CustomEvent('carana:lang-will-change', { detail: { from: currentLang, to: next } }));
    }
    stopAllAudioForSwitch();

    return ready(null, next).then(function (status) {
      if (revision !== languageRevision) return { lang: currentLang, changed: false, superseded: true };
      const active = status.ok || next === 'en' ? next : 'en';
      currentLang = active;
      pendingLang = active;
      if (status.ok) { fallbackNoticeLang = ''; lastError = ''; }
      safeWriteStorage(active);
      applyDocumentAttributes(active);
      applyStaticDom(typeof document !== 'undefined' ? document : null);
      refreshSwitchers();
      listeners.forEach(function (fn) {
        try { fn(active, resolveLocaleMeta(active)); } catch (_) {}
      });
      if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
        root.dispatchEvent(new root.CustomEvent('carana:lang-change', { detail: { lang: active, dir: resolveLocaleMeta(active).dir, fallbackNoticeLang: fallbackNoticeLang } }));
      }
      return { lang: active, changed: true, ok: status.ok };
    });
  }

  function onChange(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.add(fn);
    return function () { listeners.delete(fn); };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    LOCALES: LOCALES,
    normalizeLang: normalizeLang,
    getLang: function () { return currentLang; },
    getLanguage: function () { return currentLang; },
    getLocaleMeta: function () { return resolveLocaleMeta(currentLang); },
    isRTL: function () { return resolveLocaleMeta(currentLang).dir === 'rtl'; },
    dir: function () { return resolveLocaleMeta(currentLang).dir; },
    registerSurfaces: registerSurfaces,
    loadPack: loadPack,
    ready: ready,
    getPack: getPack,
    t: t,
    h: h,
    rawList: rawList,
    tw: tw,
    esc: esc,
    bdi: bdi,
    applyStaticDom: applyStaticDom,
    applyBidiInputs: applyBidiInputs,
    translateWorkbenchDom: translateWorkbenchDom,
    createSwitcherElement: createSwitcherElement,
    mountSwitcher: mountSwitcher,
    refreshSwitchers: refreshSwitchers,
    setLanguage: setLanguage,
    onChange: onChange,
    getFallbackNotice: function () { return fallbackNoticeLang ? { lang: fallbackNoticeLang, error: lastError } : null; },
    _localesBase: LOCALES_BASE
  };
});
