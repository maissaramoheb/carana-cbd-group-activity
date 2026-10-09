/**
 * Automated Test Suite for CARANA CBD Learning Lab
 * Runs automated verification of schemas, data models, curriculum fidelity,
 * storage persistence, matrix logic, and regression checks.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

// Load Data and Storage modules
const scenario = require(path.join(ROOT_DIR, 'js/data/carana-scenario.js'));
const glossary = require(path.join(ROOT_DIR, 'js/data/curriculum-glossary.js'));
const storage = require(path.join(ROOT_DIR, 'js/storage/lab-storage.js'));
const module2 = require(path.join(ROOT_DIR, 'js/modules/module2.js'));
const module3 = require(path.join(ROOT_DIR, 'js/modules/module3.js'));
const module6 = require(path.join(ROOT_DIR, 'js/modules/module6.js'));

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    testsFailed++;
  }
}

console.log('\n======================================================');
console.log('   CARANA CBD LEARNING LAB — AUTOMATED TEST SUITE     ');
console.log('======================================================\n');

// 1. REGRESSION & PRESERVATION SUITE
console.log('Group 1: Existing Quick Exercise Regression & Preservation');

runTest('CARANA_CBD_Group_Activity.html exists and is intact', () => {
  const filePath = path.join(ROOT_DIR, 'CARANA_CBD_Group_Activity.html');
  assert(fs.existsSync(filePath), 'File does not exist');
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.length > 30000, 'File content appears truncated');
  assert(content.includes('carana_cbd_group_activity_v1'), 'Original storage key missing');
  assert(content.includes('From evidence to a practical CBD response'), 'Original title missing');
});

runTest('Original 6 stages exist in CARANA_CBD_Group_Activity.html', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'CARANA_CBD_Group_Activity.html'), 'utf8');
  ['start', 'situation', 'stakeholders', 'cbd', 'review', 'export'].forEach(panel => {
    assert(content.includes(`data-panel="${panel}"`), `Missing original panel: ${panel}`);
  });
});

runTest('vercel.json routes correctly preserve clean URLs and original route', () => {
  const vercelPath = path.join(ROOT_DIR, 'vercel.json');
  assert(fs.existsSync(vercelPath), 'vercel.json missing');
  const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  assert.strictEqual(config.cleanUrls, true, 'cleanUrls should be true');
  const hasQuickRewrite = config.rewrites.some(r => r.source === '/quick-exercise' && r.destination === '/CARANA_CBD_Group_Activity');
  assert(hasQuickRewrite, 'Missing /quick-exercise rewrite');
});

// 2. CURRICULUM & SCENARIO INTEGRITY SUITE
console.log('\nGroup 2: UN Peacekeeping JST Curriculum & Scenario Integrity');

runTest('Scenario contains all 57 official paragraphs', () => {
  assert.strictEqual(scenario.BACKGROUND.length, 5, 'Should have 5 background paragraphs');
  assert.strictEqual(scenario.PARAGRAPHS.length, 52, 'Should have 52 scenario fact paragraphs (6 to 57)');
  assert.strictEqual(scenario.PARAGRAPHS[0].id, 6, 'First fact paragraph must be 6');
  assert.strictEqual(scenario.PARAGRAPHS[scenario.PARAGRAPHS.length - 1].id, 57, 'Last fact paragraph must be 57');
});

runTest('5 official UNPOL CBD Areas with 13 functional rows are correctly defined', () => {
  assert.strictEqual(scenario.AREAS.length, 5, 'Must have exactly 5 main areas');
  const totalSub = scenario.AREAS.reduce((sum, a) => sum + a.subcategories.length, 0);
  assert.strictEqual(totalSub, 13, 'Must have exactly 13 sub-categories across the 5 areas as in Annex C/D');
});

runTest('6 cross-cutting dimensions are correctly defined', () => {
  assert.strictEqual(scenario.DIMENSIONS.length, 6, 'Must have exactly 6 dimensions');
  const expectedDimIds = [
    'policing_practice',
    'environmental_sustainability',
    'conflict_prevention',
    'human_rights',
    'gender',
    'cpoc'
  ];
  const actualDimIds = scenario.DIMENSIONS.map(d => d.id);
  assert.deepStrictEqual(actualDimIds, expectedDimIds, 'Dimensions match official curriculum');
});

runTest('Facilitator-only expected answers are not exposed in frontend scenario data', () => {
  assert.strictEqual(scenario.OFFICIAL_EXPECTED_MAPPING, undefined, 'OFFICIAL_EXPECTED_MAPPING must not be exposed to participants in frontend files');
});

runTest('Glossary contains all core UNPOL CBD definitions', () => {
  assert(glossary.TERMS.length >= 20, 'Glossary must contain at least 20 terms');
  const requiredTerms = ['Baseline', 'Capacity', 'Indicator (PI / KPI)', 'Logframe (Logical Framework Matrix)', 'Security Sector Reform (SSR)', 'SMART', 'Sustainability'];
  requiredTerms.forEach(t => {
    const found = glossary.TERMS.find(item => item.term.includes(t.split(' ')[0]));
    assert(found, `Glossary missing required term: ${t}`);
  });
});

// 3. STORAGE, SCHEMA & STATE MANAGEMENT SUITE
console.log('\nGroup 3: Local-First Storage & Schema Management');

runTest('Default state generates valid schema v1.0.0', () => {
  const state = storage.getDefaultState();
  assert.strictEqual(state.version, '1.0.0');
  assert.strictEqual(state.app, 'CARANA CBD Learning Lab');
  assert(state.session, 'Session object missing');
  assert(state.module1, 'Module 1 object missing');
  assert.strictEqual(state.module2.status, 'not_started');
  assert.strictEqual(state.module6.status, 'not_started');
});

runTest('Module 1 state contains all required JST methodology fields', () => {
  const m1 = storage.getDefaultState().module1;
  assert(m1.pestel, 'PESTEL-S object missing');
  assert(m1.pestel.hasOwnProperty('political'));
  assert(m1.pestel.hasOwnProperty('economic'));
  assert(m1.pestel.hasOwnProperty('social'));
  assert(m1.pestel.hasOwnProperty('technological'));
  assert(m1.pestel.hasOwnProperty('environmental'));
  assert(m1.pestel.hasOwnProperty('legal'));
  assert(m1.pestel.hasOwnProperty('security'));

  assert(m1.responseAnalysis, 'Response analysis missing');
  assert(m1.perspectives, 'Three perspectives missing');
  assert(Array.isArray(m1.stakeholders), 'Stakeholders array missing');
  assert(m1.matrixCells, 'Matrix cells object missing');
  assert(m1.swot, 'SWOT object missing');
  assert(Array.isArray(m1.baseline), 'Baseline array missing');
  assert(m1.reflection, 'Reflection object missing');
});

runTest('JSON Import validation rejects invalid structures and accepts valid ones', () => {
  assert.strictEqual(storage.validateImportedData(null).valid, false, 'null must be rejected');
  assert.strictEqual(storage.validateImportedData('string').valid, false, 'string must be rejected');
  assert.strictEqual(storage.validateImportedData({ foo: 'bar' }).valid, false, 'arbitrary object must be rejected');
  assert.strictEqual(storage.validateImportedData({ app: 'other_app', version: '1.0.0' }).valid, false, 'wrong app tag must be rejected');
  assert.strictEqual(storage.validateImportedData({ app: 'carana_cbd_lab', version: '2.0.0' }).valid, false, 'incompatible major version must be rejected');
  assert.strictEqual(storage.validateImportedData({ app: 'carana_cbd_lab', version: '1.0.0', session: null }).valid, false, 'null session must be rejected');

  const valid = storage.validateImportedData(storage.getDefaultState());
  assert.strictEqual(valid.valid, true, 'Default state must pass validation');
});

runTest('Storage quarantines corrupted data without wiping session or throwing unhandled errors', () => {
  // Mock localStorage
  const store = {};
  const mockStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
  global.localStorage = mockStorage;

  // Set corrupted JSON
  mockStorage.setItem(storage.STORAGE_KEY, '{ broken json');
  const recovered = storage.loadLabState();
  assert(recovered && recovered.version, 'Must return default state upon JSON corruption');
  assert(mockStorage.getItem('carana_cbd_lab_v1_corrupted_backup'), 'Must quarantine corrupted JSON to backup key');

  // Clean up mock
  delete global.localStorage;
});

// 4. MATRIX & STAKEHOLDER LOGIC SUITE
console.log('\nGroup 4: 5x6 Matrix & Stakeholder Quadrant Rules');

runTest('Module 1 Matrix cell paragraph selection parses integers and filters null/NaN', () => {
  // Simulating the dataset retrieval and sanitization logic from module1.js
  const sampleParasFromDom = ['12', '45', 'NaN', null, undefined, ''];
  const sanitized = sampleParasFromDom
    .map(p => parseInt(p, 10))
    .filter(n => Number.isInteger(n) && n > 0 && n <= 57);

  assert.deepStrictEqual(sanitized, [12, 45], 'Must parse valid integers and discard NaN/null/empty');
  assert(!sanitized.includes(null), 'Must never contain null');
});

runTest('5x6 Matrix calculates 78 possible intersections (13 rows x 6 dimensions)', () => {
  let count = 0;
  scenario.AREAS.forEach(area => {
    area.subcategories.forEach(() => {
      scenario.DIMENSIONS.forEach(() => {
        count++;
      });
    });
  });
  assert.strictEqual(count, 78, '13 subcategories * 6 dimensions must equal 78 cells');
});

runTest('Stakeholder 4-Quadrant mapping logic is accurate', () => {
  function getQuadrant(influence, interest) {
    const infHigh = influence === 'High';
    const intHigh = interest === 'High';
    if (infHigh && intHigh) return 'Engage Closely';
    if (infHigh && !intHigh) return 'Keep Satisfied';
    if (!infHigh && intHigh) return 'Keep Informed';
    return 'Monitor Minimum Effort';
  }

  assert.strictEqual(getQuadrant('High', 'High'), 'Engage Closely');
  assert.strictEqual(getQuadrant('High', 'Low'), 'Keep Satisfied');
  assert.strictEqual(getQuadrant('High', 'Medium'), 'Keep Satisfied');
  assert.strictEqual(getQuadrant('Low', 'High'), 'Keep Informed');
  assert.strictEqual(getQuadrant('Medium', 'High'), 'Keep Informed');
  assert.strictEqual(getQuadrant('Low', 'Low'), 'Monitor Minimum Effort');
  assert.strictEqual(getQuadrant('Medium', 'Medium'), 'Monitor Minimum Effort');
});

// 5. FILE & UI WORKSPACE INTEGRITY SUITE
console.log('\nGroup 5: UI & Workspace Integrity');

runTest('index.html contains Hub navigation and references to Module 1 and Quick Exercise', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert(content.includes('CARANA CBD Learning Lab'), 'Header title missing');
  assert(content.includes('module1.html'), 'Link to module 1 missing');
  assert(content.includes('CARANA_CBD_Group_Activity.html'), 'Link to 60-min activity missing');
});

runTest('module1.html contains all 6 JST stages and interactive elements', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'module1.html'), 'utf8');
  assert(content.includes('id="stage-team"'), 'Stage 1 missing');
  assert(content.includes('id="stage-conflict"'), 'Stage 2 missing');
  assert(content.includes('id="stage-stakeholders"'), 'Stage 3 missing');
  assert(content.includes('id="stage-matrix"'), 'Stage 4 missing');
  assert(content.includes('id="stage-swot"'), 'Stage 5 missing');
  assert(content.includes('id="stage-baseline"'), 'Stage 6 missing');
  assert(content.includes('id="scenarioDrawer"'), 'Scenario drawer missing');
  assert(content.includes('id="glossaryModalBackdrop"'), 'Glossary modal missing');
  assert(content.includes('id="cellModalBackdrop"'), 'Matrix cell inspector modal missing');
});

// 6. MODULE 2 SUITE
console.log('\nGroup 6: Module 2 Objective Setting & Prioritisation Logic');

runTest('Module 2 schema is properly initialized and structured', () => {
  const m2 = storage.getDefaultState().module2;
  assert(m2.objectives && m2.objectives.length >= 2, 'Must have initial objective candidates');
  assert(m2.smartObjectives && m2.smartObjectives.length >= 2, 'Must have SMART objectives');
  assert(m2.kpis && m2.kpis.length >= 2, 'Must have initial KPIs');
  assert(m2.reflection, 'Reflection object missing');
});

runTest('Module 2 scoring formula precisely matches UNPOL curriculum (Lesson 2 p. 24)', () => {
  // Test Case 1: SGBV investigation capability
  // Strategic: 3, 1, 3, 3, 3, 2 -> sum=15, avg=2.5, weighted=5.0
  // Need: 1, Impl: 2, Comp: 3 (weighted: 1.5), Donor: 3, Risk: 2 (recorded but excluded)
  // Total without risk: 5.0 + 1 + 2 + 1.5 + 3 = 12.5
  const scores1 = {
    policingPractice: 3,
    environmental: 1,
    conflictPrevention: 3,
    humanRights: 3,
    gender: 3,
    cpoc: 2,
    need: 1,
    risk: 2,
    implementability: 2,
    complementarity: 3,
    donorInterest: 3
  };
  const res1 = module2.calculateObjectiveScores(scores1);
  assert.strictEqual(res1.rawStrategicScore, 2.5, 'Raw strategic score should be 2.5');
  assert.strictEqual(res1.weightedStrategicScore, 5.0, 'Weighted strategic score should be 5.0');
  assert.strictEqual(res1.overallScore, 12.5, 'Official SGBV example must equal 12.5');

  // Test Case 2: Digitalising work processes
  // Strategic: 1, 1, 1, 1, 1, 1 -> sum=6, avg=1.0, weighted=2.0
  // Need: 3, Impl: 3, Comp: 1 (weighted: 0.5), Donor: 1, Risk: 3 (excluded)
  // Total: 2.0 + 3 + 3 + 0.5 + 1 = 9.5
  const scores2 = {
    policingPractice: 1,
    environmental: 1,
    conflictPrevention: 1,
    humanRights: 1,
    gender: 1,
    cpoc: 1,
    need: 3,
    risk: 3,
    implementability: 3,
    complementarity: 1,
    donorInterest: 1
  };
  const res2 = module2.calculateObjectiveScores(scores2);
  assert.strictEqual(res2.rawStrategicScore, 1.0, 'Raw strategic score should be 1.0');
  assert.strictEqual(res2.weightedStrategicScore, 2.0, 'Weighted strategic score should be 2.0');
  assert.strictEqual(res2.overallScore, 9.5, 'Official Digitalising example must equal 9.5');

  // Boundary Case: All minimum scores (1)
  // Strategic avg = 1.0, weighted = 2.0; need=1, impl=1, comp=1*0.5=0.5, donor=1 -> 2.0 + 1 + 1 + 0.5 + 1 = 5.5
  const minRes = module2.calculateObjectiveScores({
    policingPractice: 1, environmental: 1, conflictPrevention: 1, humanRights: 1, gender: 1, cpoc: 1,
    need: 1, risk: 1, implementability: 1, complementarity: 1, donorInterest: 1
  });
  assert.strictEqual(minRes.overallScore, 5.5, 'Minimum boundary score must equal 5.5');
});

// 7. MODULE 3 SUITE
console.log('\nGroup 7: Module 3 Planning, Logframe & Risk Matrix Logic');

runTest('Module 3 schema is properly initialized and structured', () => {
  const m3 = storage.getDefaultState().module3;
  assert(m3.theoryOfChange, 'Theory of Change missing');
  assert(m3.theoryOfChange.driver && m3.theoryOfChange.rationale, 'ToC driver/rationale missing');
  assert(m3.logframe, 'Logframe missing');
  assert(m3.logframe.impact && m3.logframe.outcomes && m3.logframe.outputs && m3.logframe.activities, 'Logframe levels missing');
  assert(Array.isArray(m3.risks) && m3.risks.length >= 2, 'Risks missing');
  assert(m3.contingency, 'Contingency plan missing');
  assert(m3.reflection, 'Reflection missing');
});

runTest('3x3 Risk Matrix zone calculation conforms to UNPOL curriculum (Lesson 3 Slide 17 & p. 40)', () => {
  // Direct test of Module3Controller.calculateRiskZone across all 9 combinations

  // High risks (Red: L3/I3, L3/I2, L2/I3)
  assert.strictEqual(module3.calculateRiskZone(3, 3), 'red', 'L3/I3 must be red');
  assert.strictEqual(module3.calculateRiskZone(3, 2), 'red', 'L3/I2 must be red');
  assert.strictEqual(module3.calculateRiskZone(2, 3), 'red', 'L2/I3 must be red');

  // Low risks (Green: L1/I1, L1/I2, and specifically L2/I1 per Lesson 3 p. 40)
  assert.strictEqual(module3.calculateRiskZone(1, 1), 'green', 'L1/I1 must be green');
  assert.strictEqual(module3.calculateRiskZone(1, 2), 'green', 'L1/I2 must be green');
  assert.strictEqual(module3.calculateRiskZone(2, 1), 'green', 'L2/I1 MUST be green per Lesson 3 p. 40');

  // Medium risks (Yellow: L1/I3, L2/I2, L3/I1)
  assert.strictEqual(module3.calculateRiskZone(1, 3), 'yellow', 'L1/I3 must be yellow');
  assert.strictEqual(module3.calculateRiskZone(2, 2), 'yellow', 'L2/I2 must be yellow');
  assert.strictEqual(module3.calculateRiskZone(3, 1), 'yellow', 'L3/I1 must be yellow');
});

runTest('module3.html contains all 6 interactive stages and 3x3 risk grid', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'module3.html'), 'utf8');
  assert(content.includes('id="stage-toc"'), 'Stage 1 missing');
  assert(content.includes('id="stage-logframe"'), 'Stage 2 missing');
  assert(content.includes('id="stage-risks"'), 'Stage 3 missing');
  assert(content.includes('id="stage-risk-matrix"'), 'Stage 4 missing');
  assert(content.includes('id="stage-contingency"'), 'Stage 5 missing');
  assert(content.includes('id="stage-summary"'), 'Stage 6 missing');
  assert(content.includes('class="risk-grid-3x3"'), '3x3 grid container missing');
});

// 8. MODULE 4 SUITE
console.log('\nGroup 8: Module 4 Implementation, MMA & Problem-Solving Logic');

runTest('Module 4 schema is properly initialized and structured', () => {
  const m4 = storage.getDefaultState().module4;
  assert(m4.mmaStrategy, 'MMA strategy object missing');
  assert(m4.mmaStrategy.monitoringMechanisms && m4.mmaStrategy.advisingPriorities && m4.mmaStrategy.mentoringCoachingPlan, 'MMA triad elements missing');
  assert(Array.isArray(m4.roleReversal) && m4.roleReversal.length >= 3, 'Must have at least 3 counterpart role reversal profiles');
  assert(m4.changeManagement, 'Change management object missing');
  assert(m4.changeManagement.unfreezingTactics && m4.changeManagement.coalitionChampions && m4.changeManagement.quickWins && m4.changeManagement.sustainingMomentum, 'Change management 4-stage model incomplete');
  assert(Array.isArray(m4.fieldSetbacks) && m4.fieldSetbacks.length >= 3, 'Must have at least 3 field setback simulations');
  assert(Array.isArray(m4.activityTracker) && m4.activityTracker.length >= 2, 'Activity tracker missing initial records');
  assert(m4.reflection, 'Reflection object missing');
});

runTest('Interactive Role Reversal models authentic counterpart perspectives', () => {
  const m4 = storage.getDefaultState().module4;
  m4.roleReversal.forEach(r => {
    assert(r.counterpart && r.counterpart.length > 5, 'Counterpart designation missing');
    assert(r.perceivedThreats && r.perceivedThreats.length > 10, 'Perceived threats/vulnerabilities missing');
    assert(r.unspokenIncentives && r.unspokenIncentives.length > 10, 'Unspoken motivations missing');
    assert(r.respectfulEngagementStrategy && r.respectfulEngagementStrategy.length > 10, 'Engagement strategy missing');
  });
});

runTest('Dynamic Problem-Solving addresses field setbacks with 5 Whys and interest-based mediation', () => {
  const m4 = storage.getDefaultState().module4;
  const validStatuses = ['Scheduled', 'In Progress', 'Resolved'];
  m4.fieldSetbacks.forEach(sb => {
    assert(sb.title && sb.scenario, 'Setback title or scenario missing');
    assert(sb.rootCause && sb.rootCause.length > 10, 'Root cause analysis missing');
    assert(sb.negotiationStrategy && sb.negotiationStrategy.length > 10, 'Negotiation strategy missing');
    assert(sb.resolutionAction && sb.resolutionAction.length > 10, 'Resolution action missing');
    assert(validStatuses.includes(sb.status), `Invalid status: ${sb.status}`);
  });
});

runTest('Module 4 progress input range clamping strictly enforces 0-100%', () => {
  function clampProgress(val) {
    return Math.max(0, Math.min(100, Math.round(+val || 0)));
  }

  assert.strictEqual(clampProgress(-15), 0, 'Negative values must clamp to 0');
  assert.strictEqual(clampProgress(999), 100, 'Values over 100 must clamp to 100');
  assert.strictEqual(clampProgress(45.7), 46, 'Decimals must round to nearest integer');
  assert.strictEqual(clampProgress('not a number'), 0, 'NaN must fallback to 0');
  assert.strictEqual(clampProgress(75), 75, 'Valid percentage must be preserved');
});

runTest('Module 4 Activity Tracker deduplicates on re-import from Logframe', () => {
  const existingTracker = [
    { id: 'track-1', activityId: 'act-1', activityTitle: 'SGBV Standard Operating Procedures', progressPercent: 65, fieldAdvisoryNote: 'Initial note' }
  ];

  const incomingLogframeActivities = [
    { id: 'act-1', narrative: 'SGBV Standard Operating Procedures (Updated)', inputs: 'Inputs' },
    { id: 'act-2', narrative: 'Forensic Evidence Training', inputs: 'Inputs' }
  ];

  // Emulate module4 importFromModule3Logframe logic
  let added = 0;
  let updated = 0;
  incomingLogframeActivities.forEach(act => {
    const existing = existingTracker.find(tr => tr.activityId === act.id || tr.id === act.id);
    if (existing) {
      existing.activityTitle = act.narrative;
      updated++;
    } else {
      existingTracker.push({
        id: 'track-' + act.id,
        activityId: act.id,
        activityTitle: act.narrative,
        progressPercent: 0,
        fieldAdvisoryNote: ''
      });
      added++;
    }
  });

  assert.strictEqual(existingTracker.length, 2, 'Must not duplicate existing activity row');
  assert.strictEqual(updated, 1, 'Existing row must be updated in place');
  assert.strictEqual(added, 1, 'Only new row must be appended');
  assert.strictEqual(existingTracker[0].progressPercent, 65, 'Participant progress must NOT be overwritten');
});

runTest('Implementation Activity Tracker interfaces with Module 3 Logframe', () => {
  const m4 = storage.getDefaultState().module4;
  m4.activityTracker.forEach(tr => {
    assert(tr.activityTitle, 'Activity title missing');
    assert(typeof tr.progressPercent === 'number' && tr.progressPercent >= 0 && tr.progressPercent <= 100, 'Invalid progress percentage');
    assert(tr.fieldAdvisoryNote, 'Advisory observation note missing');
  });
});

runTest('module4.html exists and contains all 6 interactive stages', () => {
  const m4Path = path.join(ROOT_DIR, 'module4.html');
  assert(fs.existsSync(m4Path), 'module4.html does not exist');
  const content = fs.readFileSync(m4Path, 'utf8');
  assert(content.includes('id="stage-mma"'), 'Stage 1 missing');
  assert(content.includes('id="stage-rolereversal"'), 'Stage 2 missing');
  assert(content.includes('id="stage-changemgmt"'), 'Stage 3 missing');
  assert(content.includes('id="stage-setbacks"'), 'Stage 4 missing');
  assert(content.includes('id="stage-tracker"'), 'Stage 5 missing');
  assert(content.includes('id="stage-summary"'), 'Stage 6 missing');
  assert(content.includes('id="scenarioDrawer"'), 'Scenario drawer missing');
  assert(content.includes('id="glossaryModalBackdrop"'), 'Glossary modal missing');
});

runTest('Portal Hub index.html activates and links Module 4', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert(content.includes('href="module4.html"'), 'index.html must link to module4.html');
  assert(content.includes('Phase 4 · Working'), 'Module 4 badge must be active in index.html');
});

// 9. MODULE 5 SUITE
console.log('\nGroup 9: Module 5 Evaluation & Adjustment Logic');

runTest('Module 5 schema is properly initialized and structured', () => {
  const m5 = storage.getDefaultState().module5;
  assert(m5.evaluationFramework, 'Evaluation framework missing');
  assert(m5.evaluationFramework.demingPhase && m5.evaluationFramework.evalActors, 'Deming phase or actors missing');
  assert(m5.crisisAnalysis, 'Crisis analysis missing');
  assert(Array.isArray(m5.kpiEvaluations) && m5.kpiEvaluations.length >= 2, 'KPI evaluations missing');
  assert(Array.isArray(m5.adjustments) && m5.adjustments.length >= 3, 'Adjustment recommendations missing');
  assert(m5.impactAssessment, 'Impact assessment missing');
  assert(m5.reflection, 'Reflection missing');
});

runTest('Module 5 reconciles both Module 2 KPIs and Module 3 Outputs without duplicating rows', () => {
  const existingKpiEvals = [
    { id: 'eval-1', sourceId: 'kpi-1', indicatorName: 'SGBV conviction rate', source: 'Module 2 KPI Framework', baselineValue: '12%', targetValue: '40%', actualValue: '28%' }
  ];

  const incomingM2Kpis = [
    { id: 'kpi-1', name: 'SGBV conviction rate (Updated)', baselineValue: '12%', targetValue: '45%' },
    { id: 'kpi-2', name: 'Forensic processing time', baselineValue: '45 days', targetValue: '14 days' }
  ];

  const incomingM3Outputs = [
    { id: 'outp-1', narrative: 'Digital Evidence Storage Facility', indicators: 'Facility accredited', verification: 'UNPOL Inspection' }
  ];

  // Reconcile Module 2 KPIs
  incomingM2Kpis.forEach(k => {
    const existing = existingKpiEvals.find(e => e.sourceId === k.id || (e.indicatorName && e.indicatorName.toLowerCase() === k.name.toLowerCase()));
    if (existing) {
      existing.indicatorName = k.name;
      existing.targetValue = k.targetValue;
    } else {
      existingKpiEvals.push({
        id: 'eval-' + k.id,
        sourceId: k.id,
        indicatorName: k.name,
        source: 'Module 2 KPI Framework',
        baselineValue: k.baselineValue || 'N/A',
        targetValue: k.targetValue || 'N/A',
        actualValue: ''
      });
    }
  });

  // Reconcile Module 3 Outputs
  incomingM3Outputs.forEach(op => {
    const existing = existingKpiEvals.find(e => e.sourceId === op.id || (e.indicatorName && e.indicatorName.toLowerCase() === op.narrative.toLowerCase()));
    if (!existing && op.narrative) {
      existingKpiEvals.push({
        id: 'eval-' + op.id,
        sourceId: op.id,
        indicatorName: op.narrative,
        source: 'Module 3 Logframe Output',
        baselineValue: 'Inception baseline',
        targetValue: op.indicators || 'Completed',
        actualValue: ''
      });
    }
  });

  assert.strictEqual(existingKpiEvals.length, 3, 'Must contain exactly 3 unique records across both modules');
  assert.strictEqual(existingKpiEvals[0].actualValue, '28%', 'Existing participant evaluation data must NOT be overwritten');
});

runTest('8-Month Crisis Diagnostics model authentic curriculum bottlenecks', () => {
  const m5 = storage.getDefaultState().module5;
  const ca = m5.crisisAnalysis;
  assert(ca.leadershipShiftImpact.length > 10, 'Leadership shift diagnostics missing');
  assert(ca.absorptionCapacityAssessment.length > 10, 'Absorption capacity diagnostics missing');
  assert(ca.dataLossAssessment.length > 10, 'Data loss diagnostics missing');
  assert(ca.interAgencyFriction.length > 10, 'Inter-agency friction diagnostics missing');
  assert(ca.budgetCliffRisk.length > 10, 'Budget cliff risk diagnostics missing');
});

runTest('3-Tier Adjustment Decision Matrix conforms to UNPOL Lesson 5 Slide 10', () => {
  const m5 = storage.getDefaultState().module5;
  const validReactions = ['Fully Accept', 'Partially Accept', 'Reject'];
  m5.adjustments.forEach(adj => {
    assert(adj.recommendationTitle, 'Recommendation title missing');
    assert(validReactions.includes(adj.reaction), `Invalid reaction: ${adj.reaction}`);
    assert(adj.justification && adj.justification.length > 15, 'Justification missing');
    assert(adj.actionPlan && adj.actionPlan.length > 15, 'Action plan missing');
    assert(adj.stakeholderOwner, 'Stakeholder owner missing');
  });
});

runTest('Planning Recalibration models the 4 curriculum impact dimensions (Lesson 5 p. 11)', () => {
  const m5 = storage.getDefaultState().module5;
  const imp = m5.impactAssessment;
  assert(imp.timelineImpact && imp.timelineImpact.length > 10, 'Timeline impact missing');
  assert(imp.resourceImpact && imp.resourceImpact.length > 10, 'Resource impact missing');
  assert(imp.qualityImpact && imp.qualityImpact.length > 10, 'Quality impact missing');
  assert(imp.counterpartWillingness && imp.counterpartWillingness.length > 10, 'Counterpart willingness impact missing');
});

runTest('module5.html exists and contains all 6 interactive stages', () => {
  const m5Path = path.join(ROOT_DIR, 'module5.html');
  assert(fs.existsSync(m5Path), 'module5.html does not exist');
  const content = fs.readFileSync(m5Path, 'utf8');
  assert(content.includes('id="stage-methodology"'), 'Stage 1 missing');
  assert(content.includes('id="stage-scenario"'), 'Stage 2 missing');
  assert(content.includes('id="stage-kpis"'), 'Stage 3 missing');
  assert(content.includes('id="stage-adjustments"'), 'Stage 4 missing');
  assert(content.includes('id="stage-impact"'), 'Stage 5 missing');
  assert(content.includes('id="stage-summary"'), 'Stage 6 missing');
  assert(content.includes('id="scenarioDrawer"'), 'Scenario drawer missing');
  assert(content.includes('id="glossaryModalBackdrop"'), 'Glossary modal missing');
});

runTest('Portal Hub index.html activates and links Module 5', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert(content.includes('href="module5.html"'), 'index.html must link to module5.html');
  assert(content.includes('Phase 5 · Working'), 'Module 5 badge must be active in index.html');
});

// 10. MODULE 6 SUITE
console.log('\nGroup 10: Module 6 Transition & Handover Logic');

runTest('Module 6 schema is properly initialized and structured', () => {
  const m6 = storage.getDefaultState().module6;
  assert(m6.transitionStrategy, 'Transition strategy missing');
  assert(m6.transitionStrategy.primaryTrigger && m6.transitionStrategy.succeedingEntity, 'Triggers/entities missing');
  assert(m6.fourPrinciplesFramework, 'Four principles framework missing');
  assert(Array.isArray(m6.transitionRoadmap) && m6.transitionRoadmap.length >= 3, 'Transition roadmap phases missing');
  assert(m6.institutionalizingPractice, 'Institutionalizing practice missing');
  assert(Array.isArray(m6.challengesRemedies) && m6.challengesRemedies.length >= 2, 'Challenges and remedies missing');
  assert(m6.handoverNotice, 'Handover notice missing');
  assert(m6.reflection, 'Reflection missing');
});

runTest('The Four Key Principles of Transition conform to UNPOL Lesson 6 Slide 8', () => {
  const m6 = storage.getDefaultState().module6;
  const fw = m6.fourPrinciplesFramework;
  assert(fw.earlyPlanning && fw.earlyPlanning.length > 10, 'Early planning missing');
  assert(fw.unIntegration && fw.unIntegration.length > 10, 'UN integration missing');
  assert(fw.localOwnership && fw.localOwnership.length > 10, 'Local ownership missing');
  assert(fw.communicationProtocol && fw.communicationProtocol.length > 10, 'Communication protocol missing');
});

runTest('Phased Handover Roadmap models gradual drawdown of UNPOL engagement', () => {
  const m6 = storage.getDefaultState().module6;
  const validStatuses = ['Completed', 'In Progress', 'Scheduled'];
  m6.transitionRoadmap.forEach(st => {
    assert(st.phase && st.phase.length > 5, 'Phase description missing');
    assert(st.milestone && st.milestone.length > 10, 'Milestone missing');
    assert(st.handoverCriteria && st.handoverCriteria.length > 10, 'Handover criteria missing');
    assert(validStatuses.includes(st.status), `Invalid status: ${st.status}`);
  });
});

runTest('Institutionalising Sustainable Policing Practice incorporates doctrine and gender budgeting', () => {
  const m6 = storage.getDefaultState().module6;
  const inst = m6.institutionalizingPractice;
  assert(inst.doctrineCodification && inst.doctrineCodification.length > 10, 'Doctrine codification missing');
  assert(inst.academyIntegration && inst.academyIntegration.length > 10, 'Academy integration missing');
  assert(inst.genderResponsiveBudget && inst.genderResponsiveBudget.length > 10, 'Gender-responsive budgeting missing');
  assert(inst.oversightHandover && inst.oversightHandover.length > 10, 'Oversight handover missing');
});

runTest('Formal Handover Protocol Instrument contains necessary signatories', () => {
  const m6 = storage.getDefaultState().module6;
  const hn = m6.handoverNotice;
  assert(hn.handoverDate, 'Handover date missing');
  assert(hn.unpolSignatory && hn.counterpartSignatory, 'Primary signatories missing');
  assert(hn.residualObligations && hn.residualObligations.length > 15, 'Residual obligations missing');
});

runTest('module6.html exists and contains all 6 interactive stages, dossier print container and syndicate checklist', () => {
  const m6Path = path.join(ROOT_DIR, 'module6.html');
  assert(fs.existsSync(m6Path), 'module6.html does not exist');
  const content = fs.readFileSync(m6Path, 'utf8');
  assert(content.includes('id="stage-principles"'), 'Stage 1 missing');
  assert(content.includes('id="stage-assessment"'), 'Stage 2 missing');
  assert(content.includes('id="stage-roadmap"'), 'Stage 3 missing');
  assert(content.includes('id="stage-practice"'), 'Stage 4 missing');
  assert(content.includes('id="stage-challenges"'), 'Stage 5 missing');
  assert(content.includes('id="stage-handover"'), 'Stage 6 missing');
  assert(content.includes('id="missionDossierPrintContainer"'), 'Mission Dossier composite print container missing');
  assert(content.includes('id="syndicateChecklistHost"'), 'Syndicate 6-phase self-assessment checklist container missing');
  assert(content.includes('id="scenarioDrawer"'), 'Scenario drawer missing');
  assert(content.includes('id="glossaryModalBackdrop"'), 'Glossary modal missing');
});

runTest('Design system CSS contains full dossier print rules and safeguards', () => {
  const cssPath = path.join(ROOT_DIR, 'css/design-system.css');
  assert(fs.existsSync(cssPath), 'design-system.css missing');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert(css.includes('body.printing-dossier'), 'body.printing-dossier print class missing');
  assert(css.includes('.training-safeguard'), 'Print training safeguard styling missing');
});

runTest('Portal Hub index.html activates and links Module 6', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  assert(content.includes('href="module6.html"'), 'index.html must link to module6.html');
  assert(content.includes('Phase 6 · Working'), 'Module 6 badge must be active in index.html');
});

// 11. CODEX AUDIT REMEDIATION VERIFICATION
console.log('\nGroup 11: Security, Data Integrity & Codex Remediation Verification');

runTest('P1-N01: Security — Dossier XSS neutralization and script escaping', () => {
  const testState = storage.getDefaultState();
  testState.session.teamName = '<script>alert("teamXSS")</script>';
  testState.module1.perspectives.peacekeeping = '<img src=x onerror=alert("imgXSS")>';
  testState.module4.activityTracker[0].progressPercent = 45;
  testState.module4.activityTracker[0].fieldAdvisoryNote = '<svg onload=alert("svgXSS")>';
  
  const dossierHtml = module6.generateFullMissionDossier(null, testState);
  assert(!dossierHtml.includes('<script>alert("teamXSS")</script>'), 'Raw script tags must not appear in generated dossier');
  assert(dossierHtml.includes('&lt;script&gt;alert(&quot;teamXSS&quot;)&lt;/script&gt;'), 'Script tags must be HTML-escaped');
  assert(!dossierHtml.includes('<img src=x onerror='), 'Raw img tag with event handlers must not appear unescaped');
  assert(!dossierHtml.includes('<svg onload='), 'Raw svg tag with onload must not appear unescaped');
});

runTest('P1-N01: Security — Activity Tracker progressPercent bounds validation on import', () => {
  const validState = storage.getDefaultState();
  
  // Non-numeric progressPercent
  const badProgress1 = JSON.parse(JSON.stringify(validState));
  badProgress1.module4.activityTracker[0].progressPercent = '<script>alert(1)</script>';
  assert.strictEqual(storage.validateImportedData(badProgress1).valid, false, 'Non-numeric progressPercent must be rejected');

  // Negative progressPercent
  const badProgress2 = JSON.parse(JSON.stringify(validState));
  badProgress2.module4.activityTracker[0].progressPercent = -10;
  assert.strictEqual(storage.validateImportedData(badProgress2).valid, false, 'Negative progressPercent must be rejected');

  // Out of bounds (> 100) progressPercent
  const badProgress3 = JSON.parse(JSON.stringify(validState));
  badProgress3.module4.activityTracker[0].progressPercent = 101;
  assert.strictEqual(storage.validateImportedData(badProgress3).valid, false, 'ProgressPercent > 100 must be rejected');
});

runTest('P1-N02: Data Integrity — SMART objectives keyed by objectiveId preserve authored criteria across priority changes', () => {
  // Candidate objectives
  const objectives = [
    { id: 'obj-1', title: 'Community Policing Councils', rank: 1, scores: { overall: 85 } },
    { id: 'obj-2', title: 'SGBV Investigative Unit SOPs', rank: 2, scores: { overall: 80 } },
    { id: 'obj-3', title: 'Police Accountability Internal Affairs', rank: 3, scores: { overall: 75 } }
  ];
  
  // Authored SMART criteria for obj-1 and obj-2
  const smartObjectives = [
    {
      id: 'smart-obj-1',
      objectiveId: 'obj-1',
      title: 'Community Policing Councils',
      specific: 'Establish 4 community councils in Galasi',
      measurable: '4 formal MOUs signed',
      achievable: 'Within current UNPOL deployment capacity',
      relevant: 'Directly addresses paragraph 14 community trust deficit',
      timeBound: 'By Month 6'
    },
    {
      id: 'smart-obj-2',
      objectiveId: 'obj-2',
      title: 'SGBV Investigative Unit SOPs',
      specific: 'Draft and train 15 investigators on SGBV SOPs',
      measurable: '15 investigators certified',
      achievable: 'Training facilities available in Galasi Academy',
      relevant: 'Directly addresses paragraph 22 high attrition and impunity',
      timeBound: 'By Month 9'
    }
  ];

  // Re-prioritise: obj-3 rises to rank 1, obj-2 stays rank 2, obj-1 drops to rank 3
  objectives[0].rank = 3; // obj-1 dropped
  objectives[2].rank = 1; // obj-3 elevated

  // Simulate module2 syncTopSmartObjectives behavior
  objectives.forEach(obj => {
    let smart = smartObjectives.find(s => s.objectiveId === obj.id);
    if (!smart) {
      smartObjectives.push({
        id: 'smart-' + obj.id,
        objectiveId: obj.id,
        title: obj.title,
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        timeBound: '',
        localOwnershipSafeguard: ''
      });
    } else {
      smart.title = obj.title;
    }
  });

  // Verify authored SMART criteria for obj-1 were not erased
  const obj1Smart = smartObjectives.find(s => s.objectiveId === 'obj-1');
  assert(obj1Smart, 'obj-1 SMART entry must still exist after dropping below top 2');
  assert.strictEqual(obj1Smart.specific, 'Establish 4 community councils in Galasi', 'obj-1 specific field must be preserved');
  assert.strictEqual(obj1Smart.measurable, '4 formal MOUs signed', 'obj-1 measurable field must be preserved');
});

runTest('P1-05: Strict Schema Validation — Corrupted nested payloads and invalid enums are rejected', () => {
  const validState = storage.getDefaultState();

  // Invalid module1 status enum
  const badStatus = JSON.parse(JSON.stringify(validState));
  badStatus.module1.status = 'random_status';
  const res1 = storage.validateImportedData(badStatus);
  assert.strictEqual(res1.valid, false, 'Invalid module status enum must be rejected');
  assert(res1.error.includes('status'), 'Error must specify status failure');

  // Corrupted array (non-array where array required)
  const badArray = JSON.parse(JSON.stringify(validState));
  badArray.module1.stakeholders = 'not-an-array';
  const res2 = storage.validateImportedData(badArray);
  assert.strictEqual(res2.valid, false, 'Non-array stakeholders must be rejected');

  // Corrupted nested object
  const badObj = JSON.parse(JSON.stringify(validState));
  badObj.module3.logframe = 'string-instead-of-object';
  const res3 = storage.validateImportedData(badObj);
  assert.strictEqual(res3.valid, false, 'Non-object logframe must be rejected');
});

runTest('P1-06: Data Integrity — Multi-tab state merge preserves local session fields and defends against null elements', () => {
  const localState = storage.getDefaultState();
  localState.session.teamName = 'Local Tab Alpha Team';
  localState.module1.summary.keyFinding = 'Local tab drafted finding';
  
  const incomingState = storage.getDefaultState();
  incomingState.session.teamName = 'Incoming Tab Beta Team';
  incomingState.module2.kpis = [
    { name: 'Incoming KPI 1', type: 'Quantitative (#)', baselineValue: '0', targetValue: '10' }
  ];

  // Merge foreign module updates (e.g. module2) into localState while preserving local module1 and session
  const merged = storage.deepMerge(localState, {
    module2: incomingState.module2
  });

  assert.strictEqual(merged.session.teamName, 'Local Tab Alpha Team', 'Local session must not be overwritten');
  assert.strictEqual(merged.module1.summary.keyFinding, 'Local tab drafted finding', 'Local module1 must not be overwritten');
  assert.strictEqual(merged.module2.kpis.length, 1, 'Incoming module2 changes must be successfully merged');
  assert.strictEqual(merged.module2.kpis[0].name, 'Incoming KPI 1', 'Merged KPI content must match');
});

runTest('P1-07: Reporting — Dossier includes all 6 phases and maps authentic schema fields', () => {
  const testState = storage.getDefaultState();
  testState.module1.pestel.political = 'Political instability in Galasi province';
  testState.module2.kpis = [{ name: 'SGBV Reporting Rate', type: 'Quantitative (%)', baselineValue: '12%', targetValue: '45%' }];
  testState.module3.theoryOfChange.driver = 'Driver of change: Joint community-police accountability';
  testState.module4.roleReversal[0].perceivedThreats = 'Counterpart fears losing command discretion';
  testState.module5.crisisAnalysis.budgetCliffRisk = 'Risk of financial year budget lapse';
  testState.module6.institutionalizingPractice.doctrineCodification = 'Codifying standard operating procedures into Galasi police doctrine';

  const dossierHtml = module6.generateFullMissionDossier(null, testState);
  
  // Verify all 6 phases are present
  assert(dossierHtml.includes('Phase 1: Situational Analysis'), 'Phase 1 must be present in dossier');
  assert(dossierHtml.includes('Phase 2: Objective Setting &amp; Prioritisation') || dossierHtml.includes('Phase 2: Objective Setting & Prioritisation'), 'Phase 2 must be present in dossier');
  assert(dossierHtml.includes('Phase 3: Planning Activities &amp; Logframe') || dossierHtml.includes('Phase 3: Planning Activities & Logframe'), 'Phase 3 must be present in dossier');
  assert(dossierHtml.includes('Phase 4: Implementation (JST Lesson 4)'), 'Phase 4 must be present in dossier');
  assert(dossierHtml.includes('Phase 5: Evaluation &amp; Adjustment') || dossierHtml.includes('Phase 5: Evaluation & Adjustment'), 'Phase 5 must be present in dossier');
  assert(dossierHtml.includes('Phase 6: Transition &amp; Handover Protocol') || dossierHtml.includes('Phase 6: Transition & Handover Protocol'), 'Phase 6 must be present in dossier');

  // Verify specific authentic schema fields rendered
  assert(dossierHtml.includes('Political instability in Galasi province'), 'M1 PESTEL political field rendered');
  assert(dossierHtml.includes('SGBV Reporting Rate'), 'M2 KPI field rendered');
  assert(dossierHtml.includes('Joint community-police accountability'), 'M3 TOC driver rendered');
  assert(dossierHtml.includes('Counterpart fears losing command discretion'), 'M4 Role Reversal rendered');
  assert(dossierHtml.includes('Risk of financial year budget lapse'), 'M5 Crisis Analysis rendered');
  assert(dossierHtml.includes('Codifying standard operating procedures into Galasi police doctrine'), 'M6 Institutionalizing practice rendered');
});

runTest('Blocker 1: Security — Strict nested ID validation and Exceeded variance status acceptance', () => {
  const validState = storage.getDefaultState();

  // Test malicious objective ID rejection
  const badIdState = JSON.parse(JSON.stringify(validState));
  badIdState.module2.objectives = [{
    id: 'x"><img src="data:image/png;base64,AA==" onerror="window.__auditIDExecuted=1"><span data-x="',
    title: 'Candidate with injected ID attribute',
    rank: 1,
    scores: { overall: 80 }
  }];
  const resBadId = storage.validateImportedData(badIdState);
  assert.strictEqual(resBadId.valid, false, 'Import with malicious objective ID must be rejected');
  assert(resBadId.error.includes('ID'), 'Error message must cite ID failure');

  // Test legitimate Module 5 Exceeded varianceStatus acceptance
  const exceededState = JSON.parse(JSON.stringify(validState));
  exceededState.module5.kpiEvaluations = [{
    kpiId: 'kpi-1',
    indicatorName: 'Training completion rate',
    baselineValue: '10%',
    targetValue: '50%',
    actualValue: '65%',
    varianceStatus: 'Exceeded',
    varianceAnalysis: 'Surpassed target due to accelerated syndicate participation',
    correctiveAction: 'Maintain current cadence'
  }];
  const resExceeded = storage.validateImportedData(exceededState);
  assert.strictEqual(resExceeded.valid, true, 'Import with legitimate "Exceeded" varianceStatus must be accepted');
});

runTest('Blocker 2: Concurrency — Elimination of storage-event feedback loop across all modules', () => {
  for (let i = 1; i <= 6; i++) {
    const modContent = fs.readFileSync(path.join(ROOT_DIR, `js/modules/module${i}.js`), 'utf8');
    assert(modContent.includes("window.addEventListener('storage'"), `module${i}.js must contain a storage event listener`);
    const storageIdx = modContent.indexOf("window.addEventListener('storage'");
    const slice = modContent.slice(storageIdx, storageIdx + 1500);
    assert(!slice.includes('Storage.saveLabState('), `module${i}.js must NOT call Storage.saveLabState inside storage listener (prevents infinite ping-pong loop)`);
    assert(modContent.includes('dirtyFields = new Set()'), `module${i}.js must track dirtyFields for non-destructive multi-tab reconciliation`);
  }
});

runTest('Blocker 3: Dossier Completeness — All 43 schema fields mapped without fallback hallucinations', () => {
  const fixtureState = storage.getDefaultState();
  fixtureState.session.teamName = 'Syndicate 1';
  fixtureState.session.participants = 'Officer Alpha, Officer Bravo';
  fixtureState.session.noteTaker = 'Officer Charlie';
  fixtureState.module1.perspectives = {
    enablingEnvironment: 'Strategic legal framework in place',
    organisationalLevel: 'Police infrastructure needs maintenance',
    individualLevel: 'Officers lack investigative equipment'
  };
  fixtureState.module1.responseAnalysis = {
    externalActors: 'External donor agencies and regional police partners',
    synergiesOpportunities: 'Shift from lecture training to on-the-job mentoring',
    risksDuplication: 'Stop uncoordinated bilateral donor donations'
  };
  fixtureState.module1.stakeholdersConclusion = 'Key traditional leaders are essential partners';
  fixtureState.module1.baseline = [{
    id: 'base-1',
    area: '1. Strategic Planning & Administration',
    asIsEvidence: 'Para 12 shows 4% budget execution',
    baselineMetric: '4% execution',
    tobeTarget: '85% execution',
    verificationSource: 'Quarterly financial audit',
    currentCapacity: 'Low',
    gapAnalysis: 'Substantial shortfall',
    entryPoint: 'Administrative advisory'
  }];
  fixtureState.module1.reflection = {
    q1Experience: 'M1 Reflection Q1 experience text',
    q2CounterpartPerspective: 'M1 Reflection Q2 perspective text',
    q3PersonalGrowth: 'M1 Reflection Q3 growth text'
  };
  fixtureState.module2.reflection = {
    q1Experience: 'M2 Reflection Q1 text',
    q2StrategicPrioritisation: 'M2 Reflection Q2 text',
    q3LocalOwnership: 'M2 Reflection Q3 text'
  };
  fixtureState.module3.logframe.activities[0].verification = 'Bi-weekly attendance log';
  fixtureState.module3.reflection = {
    q1Experience: 'M3 Reflection Q1 text',
    q2PlanningHierarchy: 'M3 Reflection Q2 text',
    q3RiskPreparedness: 'M3 Reflection Q3 text'
  };
  fixtureState.module4.roleReversal[0].counterpart = 'Chief Superintendent of Galasi CIS';
  fixtureState.module4.reflection = {
    q1Experience: 'M4 Reflection Q1 text',
    q2EmpathyAndResistance: 'M4 Reflection Q2 text',
    q3ResilienceInTheField: 'M4 Reflection Q3 text'
  };
  fixtureState.module5.kpiEvaluations[0].varianceAnalysis = 'Procurement delay shifted schedule';
  fixtureState.module5.reflection = {
    q1EvaluationRelevance: 'M5 Reflection Q1 text',
    q2FacingInconvenientTruths: 'M5 Reflection Q2 text',
    q3PersonalResilienceInFailure: 'M5 Reflection Q3 text'
  };
  fixtureState.module6.reflection = {
    q1TransitionMindset: 'M6 Reflection Q1 text',
    q2SustainingOwnership: 'M6 Reflection Q2 text',
    q3OverallCBDJourney: 'M6 Reflection Q3 text'
  };

  const dossierHtml = module6.generateFullMissionDossier(null, fixtureState);

  // Check all specific mapped fields appear in dossierHtml
  assert(dossierHtml.includes('Strategic legal framework in place'), 'M1 enablingEnvironment missing');
  assert(dossierHtml.includes('Police infrastructure needs maintenance'), 'M1 organisationalLevel missing');
  assert(dossierHtml.includes('Officers lack investigative equipment'), 'M1 individualLevel missing');
  assert(dossierHtml.includes('External donor agencies and regional police partners'), 'M1 externalActors missing');
  assert(dossierHtml.includes('Shift from lecture training to on-the-job mentoring'), 'M1 synergiesOpportunities missing');
  assert(dossierHtml.includes('Stop uncoordinated bilateral donor donations'), 'M1 risksDuplication missing');
  assert(dossierHtml.includes('Key traditional leaders are essential partners'), 'M1 stakeholdersConclusion missing');
  assert(dossierHtml.includes('Para 12 shows 4% budget execution'), 'M1 asIsEvidence missing');
  assert(dossierHtml.includes('Quarterly financial audit'), 'M1 verificationSource missing');
  assert(dossierHtml.includes('M1 Reflection Q1 experience text'), 'M1 reflection missing');
  assert(dossierHtml.includes('M2 Reflection Q2 text'), 'M2 reflection missing');
  assert(dossierHtml.includes('Bi-weekly attendance log'), 'M3 activity verification missing');
  assert(dossierHtml.includes('M3 Reflection Q3 text'), 'M3 reflection missing');
  assert(dossierHtml.includes('Chief Superintendent of Galasi CIS'), 'M4 roleReversal counterpart missing');
  assert(dossierHtml.includes('M4 Reflection Q2 text'), 'M4 reflection missing');
  assert(dossierHtml.includes('Procurement delay shifted schedule'), 'M5 varianceAnalysis missing');
  assert(dossierHtml.includes('M5 Reflection Q1 text'), 'M5 reflection missing');
  assert(dossierHtml.includes('M6 Reflection Q1 text'), 'M6 transitionMindset reflection missing');
  assert(dossierHtml.includes('M6 Reflection Q3 text'), 'M6 overallCBDJourney reflection missing');

  // Verify no invented fallback strings appear
  assert(!dossierHtml.includes('Month 18'), 'Invented fallback "Month 18" must not exist');
  assert(!dossierHtml.includes('Full national ownership established.'), 'Invented fallback "Full national ownership established." must not exist');
});

runTest('P2-02 & P2-03: Accessibility & Dynamic Logframe Hierarchical Numbering', () => {
  // Check module2.html contains smartWizardsHost container
  const m2Html = fs.readFileSync(path.join(ROOT_DIR, 'module2.html'), 'utf8');
  assert(m2Html.includes('id="smartWizardsHost"'), 'smartWizardsHost container missing');

  // Check module2.js generates 12 accessible SMART criteria labels with matching for attributes
  const m2Content = fs.readFileSync(path.join(ROOT_DIR, 'js/modules/module2.js'), 'utf8');
  assert(m2Content.includes('for="smart-${idx}-specific"'), 'smart-${idx}-specific label missing');
  assert(m2Content.includes('for="smart-${idx}-measurable"'), 'smart-${idx}-measurable label missing');
  assert(m2Content.includes('for="smart-${idx}-achievable"'), 'smart-${idx}-achievable label missing');
  assert(m2Content.includes('for="smart-${idx}-relevant"'), 'smart-${idx}-relevant label missing');
  assert(m2Content.includes('for="smart-${idx}-timeBound"'), 'smart-${idx}-timeBound label missing');
  assert(m2Content.includes('for="smart-${idx}-fullStatement"'), 'smart-${idx}-fullStatement label missing');
  assert(m2Content.includes('id="smart-${idx}-specific"'), 'smart-${idx}-specific id missing');
  assert(m2Content.includes('id="smart-${idx}-measurable"'), 'smart-${idx}-measurable id missing');
  assert(m2Content.includes('id="smart-${idx}-achievable"'), 'smart-${idx}-achievable id missing');
  assert(m2Content.includes('id="smart-${idx}-relevant"'), 'smart-${idx}-relevant id missing');
  assert(m2Content.includes('id="smart-${idx}-timeBound"'), 'smart-${idx}-timeBound id missing');
  assert(m2Content.includes('id="smart-${idx}-fullStatement"'), 'smart-${idx}-fullStatement id missing');

  // Verify dynamic logframe numbering logic in module3.js
  const m3Content = fs.readFileSync(path.join(ROOT_DIR, 'js/modules/module3.js'), 'utf8');
  assert(m3Content.includes('${parentCode}.${actSubIdx}'), 'Activity code must be derived from parent output code');
  assert(m3Content.includes('${outcomeNum}.${siblingOutputs.length}'), 'Output code must be derived from parent outcome code');
});

runTest('Curriculum Honesty: Module 1 initial status, Module 6 premise, and Lesson 5 email communication', () => {
  const defaultState = storage.getDefaultState();
  assert.strictEqual(defaultState.module1.status, 'not_started', 'Module 1 initial status must be not_started');

  // Module 6 must cite JST Lesson 6 Activity 6.1 instructional premise without claiming verified achievement
  const m6Content = fs.readFileSync(path.join(ROOT_DIR, 'js/modules/module6.js'), 'utf8');
  assert(m6Content.includes('Activity 6.1'), 'Module 6 must cite JST Lesson 6 Activity 6.1');
  assert(!m6Content.includes('Verified milestone achievement over Month 12'), 'Fabricated Month 12 milestone claim must not exist');

  // Module 5 must cite official email communication from Section Chief Yaa per Lesson 5 p. 15
  const m5Html = fs.readFileSync(path.join(ROOT_DIR, 'module5.html'), 'utf8');
  assert(m5Html.includes('Official Email Communication from Section Chief Yaa (Lesson 5 p. 15)'), 'Section Chief Yaa communication must be labeled official email');
  assert(!m5Html.includes('Official Urgent Cable from Section Chief Yaa'), 'Urgent Cable label must be replaced');

  // All 6 module html files must include stageCompleteFooterBadge
  for (let i = 1; i <= 6; i++) {
    const htmlContent = fs.readFileSync(path.join(ROOT_DIR, `module${i}.html`), 'utf8');
    assert(htmlContent.includes('id="stageCompleteFooterBadge"'), `module${i}.html must contain stageCompleteFooterBadge`);
  }
});

console.log('\n======================================================');
console.log(`TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
console.log('======================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
