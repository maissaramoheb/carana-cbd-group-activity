/* Native Vercel scripts; finite educational metadata only. No learner storage. */
import { injectSpeedInsights } from './vendor/vercel-speed-insights.js';
(function (w, d) {
  'use strict';
  if (w.CARANA_MONITORING) return;
  const config = w.CARANA_MONITORING_CONFIG || {};
  const hostAllowed = /^(e-learning|cbd)\.maissara\.tech$/.test(w.location.hostname) ||
    /^carana-cbd-elearning-[a-z0-9-]+\.vercel\.app$/.test(w.location.hostname);
  const analytics = hostAllowed && config.webAnalytics === true;
  const speed = hostAllowed && config.speedInsights === true;
  const names = new Set(['lesson_started', 'lesson_completed', 'workbench_opened',
    'checkpoint_completed', 'language_selected', 'ai_assistant_opened']);
  const emitted = new Set();
  let previousPath = '';
  let speedScript;
  const language = () => {
    const lang = w.CARANA_I18N?.getLang() || d.documentElement.lang;
    return ['en', 'fr-FR', 'ar'].includes(lang) ? lang : 'en';
  };
  function route() {
    const url = new URL(w.location.href);
    if (/^\/course(?:\/|\/index\.html)?$/.test(url.pathname)) {
      if (url.hash === '#activities') return { path: '/cbd/workbenches' };
      if (url.hash === '#lesson-1') return { path: '/cbd/lessons/cbd-1', lesson: 'cbd-1' };
      return { path: '/cbd/home' };
    }
    if (/^\/platform(?:\/|\/index\.html)?$/.test(url.pathname)) {
      const lesson = url.searchParams.get('lesson');
      if (/^cbd-[2-6]$/.test(lesson)) return { path: '/cbd/lessons/' + lesson, lesson };
      return { path: '/cbd/catalog' };
    }
    const module = url.pathname.match(/^\/module([1-6])(?:\.html)?$/);
    if (module) return { path: '/cbd/workbenches/' + module[1], workbench: 'cbd-' + module[1] };
    if (/^\/(CARANA_CBD_Group_Activity(?:\.html)?|quick-exercise)\/?$/.test(url.pathname))
      return { path: '/cbd/workbenches/group', workbench: 'group' };
    if (/^\/platform\/notebook(?:\.html)?$/.test(url.pathname)) return { path: '/cbd/notebook' };
    return null;
  }
  function event(name, target) {
    if (!analytics || !names.has(name) ||
      !/^(cbd-[1-6](?::checkpoint-[1-6])?|group|interface)$/.test(target)) return false;
    const key = name + '|' + target;
    if (name !== 'language_selected' && emitted.has(key)) return false;
    emitted.add(key);
    // Pro's basic custom events permit two properties; neither is free text.
    w.va('event', { name, data: { target, language: language() } });
    return true;
  }
  function canonicalUrl() {
    const current = route();
    return current ? w.location.origin + current.path : null;
  }
  function inject(src, id) {
    if (d.getElementById(id)) return d.getElementById(id);
    const script = d.createElement('script');
    script.id = id; script.src = src; script.defer = true;
    d.head.appendChild(script);
    return script;
  }
  function changed() {
    const current = route();
    if (!current || current.path === previousPath) return;
    previousPath = current.path;
    if (analytics) w.va('pageview', { route: current.path, path: current.path });
    // Free-tier checks use document navigations; keep their entry route stable.
    if (speedScript && !speedScript.dataset.route) {
      speedScript.dataset.route = current.path; speedScript.dataset.path = current.path;
    }
    if (current.lesson) event('lesson_started', current.lesson);
    if (current.workbench) event('workbench_opened', current.workbench);
  }
  w.CARANA_MONITORING = Object.freeze({ event, route, enabled: Object.freeze({ analytics, speed }) });
  if (!route() || (!analytics && !speed)) return;
  if (analytics) {
    w.va = w.va || function () { (w.vaq = w.vaq || []).push(arguments); };
    w.va('beforeSend', value => {
      const url = canonicalUrl();
      return url ? { ...value, url } : null;
    });
    const script = inject('/_vercel/insights/script.js', 'carana-web-analytics');
    script.dataset.disableAutoTrack = '1';
  }
  if (speed) {
    injectSpeedInsights({
      sampleRate: 0.1,
      softNavs: false,
      route: route().path,
      beforeSend(value) {
        const known = /^\/cbd\/(home|catalog|notebook|lessons\/cbd-[1-6]|workbenches(?:\/(?:[1-6]|group))?)$/;
        const url = known.test(value.route) ? w.location.origin + value.route : canonicalUrl();
        return url ? { ...value, url } : null;
      }
    });
    speedScript = d.head.querySelector('script[src*="/_vercel/speed-insights/script.js"]');
    if (speedScript) speedScript.id = 'carana-speed-insights';
  }
  changed();
  w.addEventListener('hashchange', changed);
  w.addEventListener('popstate', changed);
  w.addEventListener('carana:lang-change', () => event('language_selected', 'interface'));
  d.addEventListener('click', e => {
    if (e.target.closest?.('#support-ask')) event('ai_assistant_opened', route()?.lesson || 'interface');
  });
})(window, document);
