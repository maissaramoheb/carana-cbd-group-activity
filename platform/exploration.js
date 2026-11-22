/* Explanatory history only. Never writes checkpoints, learner drafts or workbench data. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CARANA_EXPLORATION = api;
})(typeof window === 'object' ? window : null, function (host) {
  'use strict';
  const KEY = 'carana_exploration_v1', LIMIT = 192, MAX_BYTES = 96 * 1024;
  const recordKey = /^cbd-[1-6]\/\d{2}-\d{2}\/[a-f0-9]{8}$/;
  const nodeKey = /^n-[a-f0-9]{8}$/;
  const plain = v => !!v && typeof v === 'object' && !Array.isArray(v);
  function hash(text) {
    let n = 2166136261;
    for (const c of String(text)) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); }
    return (n >>> 0).toString(16).padStart(8, '0');
  }
  function et(key, vars, fallback) {
    const i18n = (typeof globalThis !== 'undefined' && globalThis.CARANA_I18N) || (typeof window !== 'undefined' && window.CARANA_I18N) || null;
    if (i18n && i18n.getLang() !== 'en') return i18n.t('exploration.' + key, vars, fallback);
    return fallback;
  }
  // Semantic identifiers survive rearrangement; changed explanatory content gets a new revision.
  const nodeId = item => 'n-' + hash((item && item._canonical && (item._canonical.id || item._canonical.label)) || item.id || item.label);
  function descriptor(lessonId, screenId, items) {
    const signature = items.map(n => {
      const c = n && n._canonical ? n._canonical : n;
      return [nodeId(n), c.label, c.question || '', c.detail || c.explain || ''].join('|');
    }).sort().join('\n');
    return { key: lessonId + '/' + screenId + '/' + hash(signature), ids: items.map(nodeId) };
  }
  const empty = () => ({ version: 1, records: {} });
  function validate(raw) {
    if (!plain(raw) || raw.version !== 1 || !plain(raw.records)) return { ok: false, message: 'Unsupported exploration history format.' };
    const entries = Object.entries(raw.records);
    if (entries.length > LIMIT || JSON.stringify(raw).length > MAX_BYTES) return { ok: false, message: 'Exploration history exceeds its local size limit.' };
    const records = {};
    for (const [k, r] of entries) {
      if (!recordKey.test(k) || !plain(r) || !Array.isArray(r.seen) || r.seen.length > 80 || r.seen.some(n => typeof n !== 'string' || !nodeKey.test(n)) ||
          (r.selected !== undefined && r.selected !== null && !nodeKey.test(r.selected)) ||
          (r.dismissed !== undefined && typeof r.dismissed !== 'boolean') || (r.practice !== undefined && typeof r.practice !== 'boolean')) {
        return { ok: false, message: 'Invalid exploration history. Existing progress was not changed.' };
      }
      const seen = [...new Set(r.seen)];
      records[k] = { seen, selected: seen.includes(r.selected) ? r.selected : null, dismissed: r.dismissed === true, practice: r.practice === true };
    }
    return { ok: true, value: { version: 1, records } };
  }
  function createStore(storage) {
    let state = empty(), failure = false;
    try { const raw = storage?.getItem(KEY); if (raw) { const v = validate(JSON.parse(raw)); if (v.ok) state = v.value; } } catch (_) { /* Legacy or corrupt auxiliary history never alters course progress. */ }
    function save() {
      const grouped = new Map();
      for (const k of Object.keys(state.records).reverse()) {
        const screen = k.slice(0, k.lastIndexOf('/')), count = grouped.get(screen) || 0;
        if (count >= 3) delete state.records[k]; else grouped.set(screen, count + 1);
      }
      const keys = Object.keys(state.records); while (keys.length > LIMIT || JSON.stringify(state).length > MAX_BYTES) delete state.records[keys.shift()];
      try { if (!storage) throw Error('Storage unavailable'); storage.setItem(KEY, JSON.stringify(state)); failure = false; return true; }
      catch (_) { failure = true; return false; }
    }
    function get(d) {
      const r = state.records[d.key] || { seen: [], selected: null, dismissed: false, practice: false };
      return { ...r, seen: r.seen.filter(n => d.ids.includes(n)), selected: d.ids.includes(r.selected) ? r.selected : null };
    }
    function sync() {
      try { const raw=storage?.getItem(KEY);if(!raw)return;const latest=validate(JSON.parse(raw));if(!latest.ok)return;
        for(const [k,r] of Object.entries(latest.value.records)) {const local=state.records[k];state.records[k]=local?{seen:[...new Set([...r.seen,...local.seen])].slice(-80),selected:local.selected||r.selected,dismissed:local.dismissed||r.dismissed,practice:local.practice||r.practice}:r;}
      }catch(_) { /* Keep the usable in-memory record if reading is denied. */ }
    }
    function update(d, change) {
      if (!recordKey.test(d.key) || d.ids.some(id => !nodeKey.test(id))) return false;
      sync();const old=get(d);state.records[d.key]={...old,...change,seen:[...new Set([...old.seen,...(change.seen||[])])].slice(-80),dismissed:old.dismissed||change.dismissed===true,practice:old.practice||change.practice===true};return save();
    }
    function exportFor(ids) {
      sync();
      const result={ version: 1, records: Object.fromEntries(Object.entries(state.records).filter(([k]) => ids.includes(k.split('/')[0])).map(([k, v]) => [k, { ...v, seen: [...v.seen] }])) };
      const keys=Object.keys(result.records);while(keys.length>LIMIT||JSON.stringify(result).length>MAX_BYTES)delete result.records[keys.shift()];
      return result;
    }
    function importFor(raw, ids, mode) {
      const v = validate(raw); if (!v.ok) return false;
      sync();
      if (mode === 'replace') for (const k of Object.keys(state.records)) if (ids.includes(k.split('/')[0])) delete state.records[k];
      for (const [k, incoming] of Object.entries(v.value.records)) {
        if (!ids.includes(k.split('/')[0])) continue;
        const old = state.records[k];
        state.records[k] = mode === 'merge' && old ? { seen: [...new Set([...old.seen, ...incoming.seen])].slice(-80), selected: old.selected || incoming.selected, dismissed: old.dismissed || incoming.dismissed, practice: old.practice || incoming.practice } : incoming;
      }
      return save();
    }
    function resetFor(ids) {
      sync();
      const targetIds = Array.isArray(ids) ? ids : [];
      for (const k of Object.keys(state.records)) {
        if (targetIds.includes(k.split('/')[0])) delete state.records[k];
      }
      if (!Object.keys(state.records).length) {
        try {
          storage?.removeItem?.(KEY);
          failure = false;
          return true;
        } catch (_) {
          failure = true;
          return false;
        }
      }
      return save();
    }
    return { get, update, exportFor, importFor, resetFor, get failed() { return failure; } };
  }
  let storage;
  try { storage = host?.localStorage; } catch (_) { /* Denied browser storage is handled visibly on writes. */ }
  const store = createStore(storage);
  function bind({ lessonId, screenId, items, buttons, feedback, count, fill, container, onSelect, practiceButtons = [], remind = true }) {
    const d = descriptor(lessonId, screenId, items), all = [...buttons];
    if (!container || !all.length || all.length !== items.length) return null;
    let state = store.get(d), reminder, nextAction;

    const doc = container.ownerDocument;
    const storageNote = doc.createElement('p'); storageNote.className = 'exploration-storage'; storageNote.setAttribute('role', 'status'); container.append(storageNote);
    const practiceNote = doc.createElement('p'); practiceNote.className = 'practice-history'; container.append(practiceNote);
    function paint() {
      all.forEach((button, i) => {
        const selected = state.selected === d.ids[i], seen = state.seen.includes(d.ids[i]);
        button.dataset.explored = String(seen); button.dataset.explorationId = d.ids[i];
        button.classList.toggle('chosen', selected); button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));

        if (feedback?.id) button.setAttribute('aria-controls', feedback.id);
        let badge = button.querySelector('.exploration-state');
        if (!badge) { badge = doc.createElement('span'); badge.className = 'exploration-state'; button.append(badge); }
        badge.textContent = ' '+(selected ? et('viewing', null, 'Viewing') : seen ? et('explored', null, 'Explored') : et('explore', null, 'Explore'));
        button.removeAttribute('aria-label');
        if(button.hasAttribute('data-lab-area')&&!button.querySelector('.exploration-cell-name')){const name=doc.createElement('span');name.className='exploration-cell-name';name.textContent=items[i].label+' ';button.prepend(name);}
      });
      if (count) { count.textContent = et('countExplored', { done: state.seen.length, total: all.length }, 'Explanations ' + state.seen.length + ' of ' + all.length + ' explored'); count.setAttribute('aria-live', 'polite'); }
      if (fill) fill.style.width = (100 * state.seen.length / all.length) + '%';
      storageNote.textContent = store.failed ? et('storageFailed', null, 'Exploration history could not save on this device. Export a backup before closing. Quiz progress is recorded separately.') : '';
      practiceNote.textContent = state.practice ? et('practiceAttempted', null, 'Practice attempted · separate from quiz achievement') : '';
      if (feedback) feedback.dataset.feedback = 'explanation';
    }
    function select(i, save = true) {
      if (!items[i]) return;
      state.selected = d.ids[i]; state.seen = [...new Set([...state.seen, d.ids[i]])];
      if (save) store.update(d, state);
      onSelect(i); paint();
      if (feedback) {
        feedback.dataset.readExplanation = 'true';
        if (!feedback.dataset.readTitle) feedback.dataset.readTitle = items[i].label || '';
        feedback.dispatchEvent(new CustomEvent('carana:explanation-updated', { bubbles: true, detail: { id: items[i].label, restored: !save, target: feedback } }));
      }
    }
    all.forEach((button, i) => button.addEventListener('click', () => select(i)));
    practiceButtons.forEach(button => button.addEventListener('click', () => { state.practice = true; store.update(d, state); paint(); }));
    paint();
    if (state.selected) select(d.ids.indexOf(state.selected), false);
    function advance(action) {
      if (!remind || state.seen.length === all.length || state.dismissed) { action(); return; }
      if (reminder && !reminder.hidden) { state.dismissed = true; store.update(d, state); action(); return; }
      nextAction = action;
      if (!reminder) {
        reminder = doc.createElement('section'); reminder.className = 'exploration-reminder'; reminder.setAttribute('aria-label', et('reminderAria', null, 'Optional exploration reminder'));
        const text = doc.createElement('p'); text.setAttribute('role', 'status'); text.textContent = et('reminderText', null, 'Some explanations are still unexplored. They may help your reasoning; opening them is not a knowledge check.');
        const review = doc.createElement('button'); review.type = 'button'; review.className = 'exploration-review'; review.textContent = et('reviewRemaining', null, 'Review remaining explanations');
        const anyway = doc.createElement('button'); anyway.type = 'button'; anyway.className = 'exploration-anyway'; anyway.textContent = et('continueAnyway', null, 'Continue anyway →');
        review.onclick = () => { reminder.hidden = true; const i = d.ids.findIndex(id => !state.seen.includes(id)); all[Math.max(0, i)].focus(); all[Math.max(0, i)].scrollIntoView({ block: 'center', behavior: 'instant' }); };
        anyway.onclick = () => { state.dismissed = true; store.update(d, state); nextAction(); };
        reminder.append(text, review, anyway);
        const navigation = doc.querySelector('#next-screen, #next');
        (navigation?.parentElement || container).before(reminder);
      }
      reminder.hidden = false; reminder.querySelector('button').focus();
    }
    return { advance, descriptor: d };
  }
  function trackPractice({lessonId, screenId, items, buttons, container}) {
    if (!container) return;
    const d=descriptor(lessonId,screenId,items), note=container.ownerDocument.createElement('p');
    note.className='practice-history';note.setAttribute('role','status');container.append(note);
    const paint=()=>{note.textContent=store.get(d).practice?et('practiceAttempted', null, 'Practice attempted · separate from quiz achievement'):'';};
    [...buttons].forEach(button=>button.addEventListener('click',()=>{store.update(d,{practice:true});paint();if(store.failed)note.textContent+=et('practiceFailed', null, ' · History could not save; export before closing.');}));paint();
  }
  return { KEY, MAX_BYTES, descriptor, validate, createStore, store, bind, trackPractice };
});
