# CARANA Run 08 — French and Arabic Audio Benchmark & Feasibility Audit

> **Review Scope Notice:** Short benchmark sample clips only. Bulk French or Arabic lesson audio was **NOT** generated in Run 08 (pending human pronunciation and voice-quality approval). All 18 Lesson 1 English MP3 recordings (`course/audio/en/lesson1/`) and 1,185 English Read Aloud clips (`course/audio/en/readaloud/clips/`) remain untouched with verified SHA-256 locks.

## 1. Benchmark Summary

Tested on `darwin` / `arm64` (Node `v26.9.0`) against locally installed models and system voices via [`tutor/tts.cjs`](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tutor/tts.cjs) and [`tools/kokoro-synth.py`](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/tools/kokoro-synth.py).

| Sample ID | Language | Engine / Voice | Acronym Normalization | Duration (s) | Latency (ms) | RTF | MP3 Size (bytes) | Status |
| :--- | :--- | :--- | :--- | ---: | ---: | ---: | ---: | :--- |
| `fr-kokoro-raw-unpol` | `fr-FR` | Kokoro-82M ONNX (`ff_siwis`) cold CLI | No | 11.58 | 2191 | 0.189 | 35156 | Sample only · Pending approval |
| `fr-kokoro-norm-unpol` | `fr-FR` | Kokoro-82M ONNX (`ff_siwis`) daemon | Yes (`fr-FR`) | 11.52 | 1634 | 0.142 | 35012 | Sample only · Pending approval |
| `fr-kokoro-norm-smart` | `fr-FR` | Kokoro-82M ONNX (`ff_siwis`) warmed daemon | Yes (`fr-FR`) | 11.06 | 754 | 0.068 | 33572 | Sample only · Pending approval |
| `fr-macos-thomas-unpol` | `fr-FR` | macOS `AVSpeechSynthesizer` (`Thomas`, compact) | Yes (`fr-FR`) | 10.38 | 1371 | 0.132 | 31556 | Sample only · System voice |
| `ar-macos-majed-l1` | `ar` | macOS `AVSpeechSynthesizer` (`Majed ar-001`, compact) | Yes (`ar`) | 15.12 | 680 | 0.045 | 45812 | Sample only · Pending approval |
| `ar-macos-majed-l2` | `ar` | macOS `AVSpeechSynthesizer` (`Majed ar-001`, compact) | Yes (`ar`) | 13.43 | 637 | 0.047 | 40700 | Sample only · Pending approval |

All raw metrics and generated MP3 artifact paths are recorded in [AUDIO_BENCHMARK.json](file:///Users/maissaraselim/Library/CloudStorage/OneDrive-Personal/Consultancy/CBD%20E%20Lap/CARANA-CBD-E-Learning/docs/reviews/run08-trilingual/AUDIO_BENCHMARK.json) and `docs/reviews/run08-trilingual/audio-samples/*.mp3`.

---

## 2. French Audio Assessment (`kokoro:ff_siwis` vs macOS `Thomas`)

1. **Availability & Licensing:**
   - `ff_siwis` is bundled locally inside `~/Library/Caches/carana-tts/voices-v1.0.bin` alongside `kokoro-v1.0.int8.onnx` (**Apache-2.0**), requiring zero paid cloud APIs and supporting `lang="fr-fr"` natively in `kokoro_onnx`.
   - Locally installed macOS French system voices (`Thomas fr-FR` compact, `Amélie fr-CA` super-compact, plus excluded novelty/Eloquence voices) carry OS system terms and cannot be redistributed as static `.mp3` assets inside the web bundle.
2. **Performance & Resource Footprint:**
   - Warmed persistent `--serve-stdio` Kokoro daemon achieved **754 ms** synthesis latency for an **11.06 s** technical passage (**0.068 RTF**) at **24 kHz** mono WAV (~531 KB uncompressed, ~33.6 KB at 24 kbps MP3).
   - Extrapolating ~34 KB average per clip across 1,185 Read Aloud blocks equals roughly **40 MB** of static MP3 assets if later approved for pre-generation — feasible for static deployment, **intentionally deferred pending human pronunciation approval**.
3. **UNPOL Terminology Handling:**
   - Expanding `UNPOL -> U N P O L`, `CBD -> C B D`, `DPO -> D P O`, `OHCHR -> O H C H R`, `5 × 6 -> 5 par 6`, and `PESTEL-S -> PESTEL S` via `normalizeForSpeech(raw, 'fr-FR')` ensures consistent French letter-by-letter acronym pronunciation instead of anglicized guessing; `CNPS` and `SMART` pass cleanly.
   - Because native French trainer/linguistic listening review is required for specialized terms (`SGBV`/`VSG`, `RBB`, `logframe`), `ff_siwis` is tagged `pendingApproval: true` in `/api/tutor/status`.

---

## 3. Arabic Audio Audit (`Majed ar-001` & Offline Engines)

1. **Kokoro & Open-Source Offline Engines:**
   - Kokoro v1.0 (`voices-v1.0.bin`) provides **no Arabic voices** (`kokoroArabicSupport: false`); only US/UK English, Spanish (`ef_dora`), and French (`ff_siwis`) appear in the local voice bundle.
   - Neither `piper` nor `espeak-ng` is installed in this environment.
2. **macOS System Arabic Voices (`AVSpeechSynthesizer`):**
   - Only `com.apple.voice.compact.ar-001.Maged` (`Majed`, quality `1` = compact) and its `super-compact` counterpart are installed on the host.
   - Live macOS bridge (`apple:majed`) synthesizes Modern Standard Arabic cleanly offline (**637–680 ms** for 13.4–15.1 s passages, **0.045–0.047 RTF**), handling Arabic script directly while keeping Latin acronyms (`PESTEL S`) isolated via `normalizeForSpeech(raw, 'ar')`.
   - **Limitations:** Compact quality is less natural than neural studio voices; mixed Arabic/English sentences introduce minor prosodic breaks at Latin acronyms (`PESTEL-S`, `UNPOL`); macOS system voice audio cannot be bundled or distributed statically across Windows/Linux/iOS web visitors.

---

## 4. Production Runtime Safeguards Implemented

1. **Strict Language Isolation (Zero English Fallback):** In `platform/learning-support.js` and `tutor/tts.cjs`, selecting French or Arabic excludes the English studio Read Aloud manifest (`course/audio/en/readaloud/manifest.json`) and English `kokoro` / `apple:nora` voices, filters `speechSynthesis.getVoices()` strictly by active language prefix (`fr` or `ar`), and discloses explicitly when no verified local/device voice exists rather than silently falling back to English.
2. **Explicit Playback & Stop Guarantees:** No autoplay; mutual exclusion across Read Aloud, Lesson 1 narration, and media elements; immediate stop on navigation, language switch (`CARANA_I18N.stopAllAudioForSwitch()`), panel close, and page visibility backgrounding.
3. **Complete Text & Transcript Availability:** All 18 Lesson 1 transcripts and all French/Arabic screen explanations remain 100% readable in DOM regardless of browser TTS availability.
