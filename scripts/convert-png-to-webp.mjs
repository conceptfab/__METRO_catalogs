// scripts/convert-png-to-webp.mjs
// Konwertuje wszystkie .png w podanym katalogu (rekurencyjnie) na .webp
// z zachowaniem kanału alpha. Nie usuwa oryginałów — to robi osobny krok.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.argv[2];
if (!ROOT) {
  console.error('Usage: node scripts/convert-png-to-webp.mjs <directory>');
  process.exit(1);
}

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) yield full;
  }
}

let converted = 0;
let skipped = 0;
for await (const png of walk(ROOT)) {
  const webp = png.replace(/\.png$/i, '.webp');
  try {
    await fs.access(webp);
    skipped++;
    continue;
  } catch {}
  await sharp(png)
    .webp({ quality: 90, alphaQuality: 100, lossless: false, effort: 6 })
    .toFile(webp);
  console.log(`  → ${path.relative(process.cwd(), webp)}`);
  converted++;
}
console.log(`\nConverted: ${converted}, skipped (already exists): ${skipped}`);
