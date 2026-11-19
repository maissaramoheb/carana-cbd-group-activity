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
  for (const p of PASSAGES) {
    const sec = document.createElement('section');
    sec.innerHTML =
      `<div class="vc-passage-box"><h2>${p.title}</h2><p>${p.text}</p></div>` +
      '<div class="vc-grid">' +
      p.candidates.map(c =>
        `<article class="vc-card ${c.rec ? 'recommended' : ''}">` +
        `<div class="vc-card-head"><h3>${c.name}</h3><span class="vc-tag">${c.tag}</span></div>` +
        `<p class="vc-meta">${c.note}</p>` +
        `<audio controls preload="none" src="./audio/en/comparison/${c.file}"></audio>` +
        '</article>'
      ).join('') +
      '</div>';
    host.append(sec);
  }
})();
