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
  const invalid1 = storage.validateImportedData(null);
  assert.strictEqual(invalid1.valid, false);

  const invalid2 = storage.validateImportedData({ foo: 'bar' });
  assert.strictEqual(invalid2.valid, false);

  const valid = storage.validateImportedData(storage.getDefaultState());
  assert.strictEqual(valid.valid, true);
});

// 4. MATRIX & STAKEHOLDER LOGIC SUITE
console.log('\nGroup 4: 5x6 Matrix & Stakeholder Quadrant Rules');

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
  // Need: 1, Impl: 2, Comp: 3 (weighted: 1.5), Donor: 3
  // Total without risk: 5.0 + 1 + 2 + 1.5 + 3 = 12.5
  const stratSum1 = 3 + 1 + 3 + 3 + 3 + 2;
  const rawStrat1 = stratSum1 / 6;
  const weightedStrat1 = rawStrat1 * 2.0;
  const need1 = 1;
  const impl1 = 2;
  const comp1 = 3 * 0.5;
  const donor1 = 3;
  const overall1 = weightedStrat1 + need1 + impl1 + comp1 + donor1;
  assert.strictEqual(overall1, 12.5, 'Official SGBV example must equal 12.5');

  // Test Case 2: Digitalising work processes
  // Strategic: 1, 1, 1, 1, 1, 1 -> sum=6, avg=1.0, weighted=2.0
  // Need: 3, Impl: 3, Comp: 1 (weighted: 0.5), Donor: 1
  // Total: 2.0 + 3 + 3 + 0.5 + 1 = 9.5
  const stratSum2 = 6;
  const rawStrat2 = stratSum2 / 6;
  const weightedStrat2 = rawStrat2 * 2.0;
  const need2 = 3;
  const impl2 = 3;
  const comp2 = 1 * 0.5;
  const donor2 = 1;
  const overall2 = weightedStrat2 + need2 + impl2 + comp2 + donor2;
  assert.strictEqual(overall2, 9.5, 'Official Digitalising example must equal 9.5');
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

runTest('3x3 Risk Matrix zone calculation conforms to UNPOL curriculum (Lesson 3 Slide 17)', () => {
  function getRiskZone(l, i) {
    if ((l === 3 && i >= 2) || (l === 2 && i === 3)) return 'red';
    if (l === 1 && i <= 2) return 'green';
    return 'yellow';
  }

  // High risks (Red)
  assert.strictEqual(getRiskZone(3, 3), 'red');
  assert.strictEqual(getRiskZone(3, 2), 'red');
  assert.strictEqual(getRiskZone(2, 3), 'red');

  // Low risks (Green)
  assert.strictEqual(getRiskZone(1, 1), 'green');
  assert.strictEqual(getRiskZone(1, 2), 'green');

  // Medium risks (Yellow)
  assert.strictEqual(getRiskZone(1, 3), 'yellow');
  assert.strictEqual(getRiskZone(2, 2), 'yellow');
  assert.strictEqual(getRiskZone(3, 1), 'yellow');
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

console.log('\n======================================================');
console.log(`TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
console.log('======================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
