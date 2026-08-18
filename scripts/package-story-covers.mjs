import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const htmlPath = path.join(root, 'public', 'storyos.html');
const outDir = path.join(root, 'public', 'downloads', 'storyos-30-covers');
const manifestPath = path.join(root, 'public', 'downloads', 'storyos-30-covers-manifest.json');

const html = fs.readFileSync(htmlPath, 'utf8');
const marker = 'const STORIES = ';
const start = html.indexOf(marker);
if (start < 0) throw new Error('Could not find STORIES array in public/storyos.html');
const arrayStart = start + marker.length;
const arrayEnd = html.indexOf(';', arrayStart);
if (arrayEnd < 0) throw new Error('Could not find end of STORIES array');
const source = html.slice(arrayStart, arrayEnd).trim();
const stories = vm.runInNewContext(`(${source})`, Object.create(null), { timeout: 2000 });

const books = stories.filter((item) => item && item.program === 'שעת סיפור והמחשה');
if (books.length !== 30) {
  throw new Error(`Expected exactly 30 story-hour books, found ${books.length}`);
}

function findAsset(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const preferred = ['cover', 'coverUrl', 'image', 'imageUrl', 'thumbnail'];
  for (const key of preferred) {
    const value = obj[key];
    if (typeof value === 'string' && /\/story-assets\/[^\s"']+\.(png|jpe?g|webp)$/i.test(value)) return value;
  }
  for (const value of Object.values(obj)) {
    if (typeof value === 'string' && /\/story-assets\/[^\s"']+\.(png|jpe?g|webp)$/i.test(value)) return value;
  }
  return null;
}

function safeName(value) {
  return String(value || '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

const manifest = [];
const seen = new Set();
for (const [index, book] of books.entries()) {
  const asset = findAsset(book);
  if (!asset) throw new Error(`No cover asset found for ${book.id || index + 1}: ${book.title || ''}`);
  const relative = asset.replace(/^\//, '');
  const src = path.join(root, 'public', relative);
  if (!fs.existsSync(src)) throw new Error(`Cover file is missing: ${relative}`);
  if (seen.has(relative)) throw new Error(`Duplicate cover asset used by more than one book: ${relative}`);
  seen.add(relative);

  const ext = path.extname(relative) || '.png';
  const number = String(index + 1).padStart(2, '0');
  const title = safeName(book.title || book.id || `ספר-${number}`);
  const destName = `${number} - ${title}${ext}`;
  fs.copyFileSync(src, path.join(outDir, destName));
  manifest.push({
    number: index + 1,
    id: book.id,
    title: book.title,
    author: book.author || '',
    source: `/${relative}`,
    savedAs: destName,
  });
}

if (manifest.length !== 30 || seen.size !== 30) {
  throw new Error(`Packaging validation failed: manifest=${manifest.length}, unique covers=${seen.size}`);
}

fs.writeFileSync(manifestPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  count: manifest.length,
  program: 'שעת סיפור והמחשה',
  covers: manifest,
}, null, 2) + '\n', 'utf8');

console.log(`Prepared ${manifest.length} unique story covers in ${path.relative(root, outDir)}`);
