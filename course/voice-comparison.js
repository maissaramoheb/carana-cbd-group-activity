(function () {
  'use strict';
  const PASSAGES = [
    {
      id: 'p1',
      title: 'Passage A · Lesson 1 Diagnostic Decision Path & “Possible causes”',
      text: 'Distinguish symptoms from training gaps. Imagine arriving in Galasi and hearing that investigators need urgent training. Before designing any course, pause to check whether the evidence actually points to missing skills or to another constraint. Possible causes. Can evidence point away from training? Consider supervision, case-file procedures, equipment, incentives, and skills.',
      candidates: [
        { name: '1. Baseline Browser Voice (Samantha Compact)', file: 'p1-samantha.mp3', tag: 'Baseline · Robotic', note: 'Previous Run 06 default browser SpeechSynthesis output on macOS.', rec: false },
        { name: '2. macOS Native Neural (Apple Voice 4 / Nora)', file: 'p1-apple-nora.mp3', tag: 'Local macOS Only', note: 'Clear prosody, but inaccessible in browser SpeechSynthesis and mispronounces “Galasi” as “Galaxy”.', rec: false },
        { name: '3. Kokoro-82M Neural · Heart (Selected Default)', file: 'p1-kokoro-af-heart.mp3', tag: 'Selected · Studio Default', note: 'Warm, human instructional clarity with accurate CARANA/Galasi pronunciation across all devices.', rec: true },
        { name: '4. Kokoro-82M Neural · Emma (en-GB)', file: 'p1-kokoro-bf-emma.mp3', tag: 'Alternative UK Voice', note: 'Crisp British UN facilitator cadence; selectable in local studio.', rec: false },
        { name: '5. Kokoro-82M Neural · Michael (en-US)', file: 'p1-kokoro-am-michael.mp3', tag: 'Alternative Male Voice', note: 'Calm baritone matching Lesson 1 Trainer Narration tone.', rec: false }
      ]
    },
    {
      id: 'p2',
      title: 'Passage B · UNPOL Acronyms, Frameworks & Terminology',
      text: 'In CARANA, a CBD situational analysis combines a PESTEL-S context scan, a 5×6 capacity matrix, and a SWOT synthesis to build an evidence-led Logframe with SMART indicators and KPI tracking for MMA under UNSCR 2151, incorporating UNPOL, CPOC, SGBV, DPO, and OHCHR standards.',
      candidates: [
        { name: '1. Baseline Browser Voice (Samantha Compact)', file: 'p2-samantha.mp3', tag: 'Baseline · Robotic', note: 'Compact voice cadence struggles with dense technical acronyms.', rec: false },
        { name: '2. macOS Native Neural (Apple Voice 4 / Nora)', file: 'p2-apple-nora.mp3', tag: 'Local macOS Only', note: 'Better intonation locally on Mac, though not exposed to static web browsers.', rec: false },
        { name: '3. Kokoro-82M Neural · Heart + Normalizer', file: 'p2-kokoro-af-heart.mp3', tag: 'Selected · Normalized Terms', note: 'Explicit UNPOL terminology lexicon prevents slur/misreading on PESTEL-S, UNPOL, UNSCR 2151, and MMA.', rec: true },
        { name: '4. Kokoro-82M Neural · Emma + Normalizer', file: 'p2-kokoro-bf-emma.mp3', tag: 'Alternative UK Voice', note: 'British UN trainer delivery with identical acronym lexicon.', rec: false },
        { name: '5. Kokoro-82M Neural · Michael + Normalizer', file: 'p2-kokoro-am-michael.mp3', tag: 'Alternative Male Voice', note: 'Balanced baritone alternative with identical acronym clarity.', rec: false }
      ]
    }
  ];

  const host = document.getElementById('vc-samples');
  const tableEl = document.querySelector('.vc-table');
  const i18n = window.CARANA_I18N;
  const enTitle = document.title;
  const enTableHtml = tableEl ? tableEl.innerHTML : '';

  function render() {
    host.querySelectorAll('audio').forEach(a => { try { a.pause(); } catch (_) {} });
    const isEn = !i18n || i18n.getLang() === 'en';
    const esc = i18n ? i18n.esc : (s => String(s));
    document.title = isEn ? enTitle : i18n.t('voicePages.comparisonTitle', null, enTitle);
    if (i18n) i18n.applyStaticDom(document);

    const ui = !isEn && i18n ? (i18n.getPack('ui') || {}) : {};
    const vp = ui.voicePages || {};
    const locPassages = Array.isArray(vp.comparisonPassages) ? vp.comparisonPassages : null;

    host.innerHTML = '';
    PASSAGES.forEach((p, idx) => {
      const lp = locPassages && locPassages[idx];
      const title = (lp && lp.title) || p.title;
      const text = (lp && lp.text) || p.text;
      const sec = document.createElement('section');
      sec.innerHTML =
        `<div class="vc-passage-box"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>` +
        '<div class="vc-grid">' +
        p.candidates.map((c, cIdx) => {
          const lc = lp && lp.candidates && lp.candidates[cIdx];
          const cname = (lc && lc.name) || c.name;
          const ctag = (lc && lc.tag) || c.tag;
          const cnote = (lc && lc.note) || c.note;
          return `<article class="vc-card ${c.rec ? 'recommended' : ''}">` +
            `<div class="vc-card-head"><h3>${esc(cname)}</h3><span class="vc-tag">${esc(ctag)}</span></div>` +
            `<p class="vc-meta">${esc(cnote)}</p>` +
            `<audio controls preload="none" src="./audio/en/comparison/${c.file}"></audio>` +
            '</article>';
        }).join('') +
        '</div>';
      host.append(sec);
    });

    if (tableEl) {
      if (isEn) {
        tableEl.innerHTML = enTableHtml;
      } else if (Array.isArray(vp.comparisonCols) && Array.isArray(vp.comparisonRows)) {
        tableEl.innerHTML =
          '<thead><tr>' + vp.comparisonCols.map(c => `<th>${esc(c)}</th>`).join('') + '</tr></thead>' +
          '<tbody>' + vp.comparisonRows.map(r => '<tr><td><strong>' + esc(r[0]) + '</strong></td>' + r.slice(1).map(cell => '<td>' + esc(cell) + '</td>').join('') + '</tr>').join('') + '</tbody>';
      }
    }
  }

  if (i18n) {
    i18n.mountSwitcher('#vc-lang-slot', { variant: 'light' });
    i18n.onChange(render);
    if (i18n.getLang() === 'en') render();
    else i18n.ready(['ui']).then(render);
  } else {
    render();
  }
})();
