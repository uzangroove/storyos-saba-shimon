import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('public/storyos.html', 'utf8');
const index = fs.readFileSync('public/index.html', 'utf8');
const viewer = fs.readFileSync('public/book-viewer.html', 'utf8');
const unified = fs.readFileSync('public/storyos-unified-controls.js', 'utf8');
const validation = JSON.parse(fs.readFileSync('public/storyos-v22-validation.json', 'utf8'));

function findArrayEnd(source, arrayStart) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = arrayStart; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      continue;
    }
    if (c === '[') depth++;
    if (c === ']' && --depth === 0) return i;
  }
  throw new Error('STORIES array end not found');
}

function extractStories() {
  const marker = 'const STORIES = [';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('STORIES marker missing');
  const arrayStart = start + marker.length - 1;
  const end = findArrayEnd(html, arrayStart);
  return JSON.parse(html.slice(arrayStart, end + 1));
}

const stories = extractStories();
const ids = stories.map((item) => item.id);
const duplicateIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
const counts = Object.fromEntries(
  [...new Set(stories.map((item) => item.program))]
    .sort()
    .map((program) => [program, stories.filter((item) => item.program === program).length])
);
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });

const expectedIds = {
  story: Array.from({ length: 30 }, (_, i) => `s${String(i + 1).padStart(2, '0')}`),
  drawing: Array.from({ length: 22 }, (_, i) => `art${String(i + 1).padStart(2, '0')}`),
  puppet: Array.from({ length: 5 }, (_, i) => `puppet${String(i + 1).padStart(2, '0')}`),
  toddler: Array.from({ length: 9 }, (_, i) => `t${String(i + 1).padStart(2, '0')}`),
  music: Array.from({ length: 22 }, (_, i) => `music${String(i + 1).padStart(2, '0')}`)
};

check('v22 validation release', validation.release === '22.0.0', validation.release);
check('v22 validation branch', validation.branch === 'release/storyos-v22-production', validation.branch);
check('Production promotion requires approval', validation.productionPromotionRequiresApproval === true);
check('88 runtime items', stories.length === validation.expectedRuntimeItems, `found ${stories.length}`);
check('5 programs', Object.keys(counts).length === validation.expectedPrograms, JSON.stringify(counts));
check('Expected program counts', JSON.stringify(counts) === JSON.stringify(Object.fromEntries(Object.entries(validation.expectedCounts).sort())), JSON.stringify(counts));
check('No duplicate IDs', duplicateIds.length === 0, duplicateIds.join(','));

for (const [group, expected] of Object.entries(expectedIds)) {
  const missing = expected.filter((id) => !ids.includes(id));
  check(`${group} IDs complete`, missing.length === 0, missing.join(','));
}

check('Five activity tiles', (html.match(/class="activity-tile"/g) || []).length === 5);
check('Song activity tile', html.includes('data-program="שיר נולד בגן"'));
check('Dashboard total 88', /id="count"[^>]*>\s*88\s*</.test(html));
check('RTL StoryOS core', html.includes('<html lang="he" dir="rtl">'));
check('RTL scanned viewer', viewer.includes('<html lang="he" dir="rtl">'));

check('v22 shell title', index.includes('Story OS · סבא שמעון · גרסה 22'));
check('v22 core cache key', index.includes('/storyos.html?v=22.0.0'));
check('v22 unified controls cache key', index.includes('/storyos-unified-controls.js?v=22.0.0'));
check('v22 scanned viewer cache key', index.includes('/book-viewer.html?v=22.0.0'));
check('Runtime shell updates visible version', index.includes("doc.title = 'Story OS · סבא שמעון · גרסה 22'") && index.includes("replace(/גרסה 20(?:\\.\\d+)?/g, 'גרסה 22')"));
check('Runtime shell updates five-program wording', index.includes("replace('ארבעה מסלולי פעילות', 'חמישה מסלולי פעילות')"));

check('Unified controls loaded', index.includes('/storyos-unified-controls.js?v=22.0.0'));
check('Unified controls panel exists', unified.includes("aside.id = 'v20UnifiedControls'"));
check('Live mode entry', html.includes('window.startLive'));
check('Timer exists', html.includes('id="timer"') && html.includes('function startTimer'));
check('PDF deck support', html.includes('application/pdf') && html.includes('DECK_DB_NAME'));
check('Image deck support', html.includes('image/') || html.includes('accept="image'));
check('Persistent story decks', html.includes('indexedDB.open') && html.includes('StoryOS_SabaShimon_Decks'));
check('Scanned book viewer entry', index.includes('/book-viewer.html?v=22.0.0'));
check('Scanned viewer IndexedDB', viewer.includes("const DB_NAME = 'storyos-scanned-books'") && viewer.includes('indexedDB.open'));
check('Story-hour CSV export', html.includes('StoryOS_רשימת_30_ספרים_מלאה_') && html.includes('.csv'));

for (const [fileName, source] of [
  ['storyos.html', html],
  ['index.html', index],
  ['book-viewer.html', viewer],
  ['storyos-unified-controls.js', unified]
]) {
  let syntaxOk = true;
  let syntaxError = '';
  try {
    if (fileName.endsWith('.html')) {
      const scripts = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
        .map((m) => m[1])
        .filter(Boolean);
      scripts.forEach((code, i) => new vm.Script(code, { filename: `${fileName}:inline-${i + 1}` }));
    } else {
      new vm.Script(source, { filename: fileName });
    }
  } catch (err) {
    syntaxOk = false;
    syntaxError = err.message;
  }
  check(`${fileName} JS syntax`, syntaxOk, syntaxError);
}

const missingAssets = [];
for (const item of stories) {
  if (typeof item.cover === 'string' && item.cover.startsWith('/')) {
    const assetPath = `public${item.cover}`;
    if (!fs.existsSync(assetPath)) missingAssets.push(assetPath);
  }
}
check('Referenced local cover assets exist', missingAssets.length === 0, missingAssets.join(','));

const failed = checks.filter((item) => !item.pass);
const report = {
  version: '22.0.0',
  branch: 'release/storyos-v22-production',
  generatedAt: new Date().toISOString(),
  summary: {
    total: checks.length,
    passed: checks.length - failed.length,
    failed: failed.length,
    pass: failed.length === 0
  },
  runtime: {
    items: stories.length,
    programs: counts,
    duplicateIds
  },
  checks
};

console.log(JSON.stringify(report, null, 2));
if (failed.length) {
  for (const failure of failed) {
    console.error(`FAIL: ${failure.name}${failure.detail ? ` — ${failure.detail}` : ''}`);
  }
  process.exit(1);
}
