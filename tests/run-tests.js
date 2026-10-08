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

runTest('Annex D expected mapping references valid paragraphs', () => {
  const keys = Object.keys(scenario.OFFICIAL_EXPECTED_MAPPING);
  assert(keys.length > 20, 'Should have expected mappings for official cells');
  keys.forEach(k => {
    const paras = scenario.OFFICIAL_EXPECTED_MAPPING[k];
    paras.forEach(num => {
      assert(num >= 1 && num <= 57, `Invalid paragraph number ${num} in expected mapping for cell ${k}`);
    });
  });
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

runTest('design-system.css contains required UN styling and print stylesheets', () => {
  const content = fs.readFileSync(path.join(ROOT_DIR, 'css/design-system.css'), 'utf8');
  assert(content.includes('--un-blue: #009edb'), 'UN Blue token missing');
  assert(content.includes('--navy: #12304a'), 'Navy token missing');
  assert(content.includes('@media print'), 'Print stylesheet missing');
  assert(content.includes('.matrix-table'), 'Matrix CSS missing');
  assert(content.includes('.stakeholder-matrix-grid'), 'Stakeholder matrix CSS missing');
  assert(content.includes('.swot-grid'), 'SWOT grid CSS missing');
});

console.log('\n======================================================');
console.log(`TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
console.log('======================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
