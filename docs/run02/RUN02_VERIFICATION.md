# Run02 verification

## Baseline

Run01 local/remote source 44e9860, main 7e25176, verified prior backup and dedicated branch codex/cbd-instructional-run02. Custom domains remain assigned to the same Run01/earlier deployments. A complete-history pre-change bundle was created and verified.

## Automated gates

npm test includes the original 65 activity checks, Lesson1's 32 smoke assertions, negative media-build checks, content/budget schema checks, and new draft-boundary/weight-sensitivity/HTML-escaping tests. No new dependencies. JavaScript syntax checks and git diff --check are also required. The build validates source metadata, tool structures, feedback, complete artwork briefs and all 18 locked MP3s. Tests must pass before committing a release artifact.

## Browser scope

The Lesson2 benchmark completed first in desktop Chromium, desktop WebKit and mobile WebKit. The final suite exercises every enhanced screen, all concept nodes, every applied decision and all 42 checkpoint items in those three profiles. Applied tools cover empty/wrong/correct input, draft and parameter restoration, explicit no-text-grade feedback and keyboard operations. Mobile WebKit uses a touch-capable context and actual tap actions for decision selection.

Failure/compatibility paths include invalid current progress, a denied storage write, missing lesson data, Run01-version archival without granting revised checkpoints, and a downloaded export containing the archived record. Exact checkpoint view resumes after reload; transient partial answers do not. The independent MMA orientation fixture still uses the unchanged shared contract and remains excluded from public content.

The preserved Lesson1 browser suite exercises all 18 screens, all 18 tracks, three images, checkpoints, same-origin Module1 confirmation, resume, the gallery at narrow/tablet sizes, and failure cases. Byte comparison protects all original HTML/JS/CSS, Lesson1 content/runtime/media, concept note and budget inputs.

## Accessibility and limits

Axe covers new first-screen states and each of the 17 applied tools, plus Lesson1 home/checkpoint/matrix. Semantic buttons, labelled ranges/selects/textareas, fieldsets, table headers and live status support keyboard and screen-reader access. Automated scans are sampled and do not establish full WCAG2.2AA or VoiceOver acceptance. Narrow/tablet and RTL reflow are separately recorded; learner content remains English.

Screenshots/logs and actual hosted-smoke results are included in the final backup. Native Safari hosted checks are limited smoke evidence, distinct from complete local journeys. Physical iOS devices, full assistive technology, human curriculum/rights acceptance and learner-effectiveness validation remain open. No field pilot or paid media generation occurred.

## Failures resolved before release

The initial Lesson2 harness selected the last disclosure instead of the transcript; it now targets the transcript explicitly. A version-label guard dereferenced absent legacy progress and was corrected. Their subsequent full benchmark passed before extension. No test was relaxed to treat either failure as success.

## Recorded final results

All 38 enhanced screens and all 42 checkpoint questions passed in desktop Chromium, desktop WebKit and mobile WebKit. All 17 applied tools were exercised, including bounded draft persistence, classification feedback, ranking/risk states and keyboard access. Downloaded progress retained the earlier Run01 completion metadata without granting revised checkpoints. Twenty-two Chromium Axe reports (five first screens plus seventeen tools) recorded zero violations.

The unchanged Lesson1 suite passed in Chromium, desktop WebKit and mobile WebKit, including all 18 recordings. The 320px sweep detected a long source filename overflowing in Lesson4's completed-progress state. The source metadata now wraps; the complete LTR/RTL narrow/tablet sweep is rerun after that scoped CSS correction. This is distinct from the earlier 390px mobile journey and is retained as a resolved responsiveness finding.

The same sweep separately exposed the expanded demonstration selector's intrinsic width at 320px. Its width is now constrained to the container and its touch height is at least44px. The budget table intentionally retains local horizontal scrolling. These distinct causes were diagnosed from real element measurements rather than hiding page overflow.

Final narrow result: all38 enhanced screens passed at320/768px in both LTR and RTL, and the demonstration reflow passed after the two scoped corrections. The reusable sweep is tests/platform/layout.cjs; use the same CBD_TEST_MODULES/CBD_TEST_URL/CBD_TEST_OUTPUT variables as the browser suite. No Arabic translation, physical-iOS or full screen-reader qualification is implied.
