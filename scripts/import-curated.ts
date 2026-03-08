/**
 * Curated words import script
 *
 * curated-words.json dosyasındaki kelimeleri D1'e ekler.
 * Zaten var olan kelimeleri atlar (INSERT OR IGNORE).
 *
 * Kullanım:
 *   npx tsx scripts/import-curated.ts          # local
 *   npx tsx scripts/import-curated.ts --remote  # production
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface WordEntry {
  word: string;
  length: number;
  meaning: string;
  context: string;
  category: 'isim' | 'sıfat' | 'fiil';
}

const isRemote = process.argv.includes('--remote');
const flag = isRemote ? '--remote' : '--local';

const words: WordEntry[] = JSON.parse(
  readFileSync(join(__dirname, 'curated-words.json'), 'utf-8')
);

const esc = (s: string) => s.replace(/'/g, "''");

const insertWords = words
  .map(({ word, meaning, context, category }) =>
    `INSERT OR IGNORE INTO words (word, meaning, context, category, length) VALUES ('${esc(word)}', '${esc(meaning)}', '${esc(context)}', '${esc(category)}', ${word.length});`
  )
  .join('\n');

// Geçici SQL dosyasına yaz (exec limiti aşmamak için)
const sqlPath = join(__dirname, '_import_tmp.sql');
writeFileSync(sqlPath, insertWords, 'utf-8');

console.log(`Importing ${words.length} words (${flag})...`);

const byLength: Record<number, number> = {};
for (const w of words) byLength[w.length] = (byLength[w.length] ?? 0) + 1;
for (const [len, cnt] of Object.entries(byLength).sort())
  console.log(`  ${len} harf: ${cnt} kelime`);

execSync(
  `wrangler d1 execute nurdle-db ${flag} --file=${sqlPath}`,
  { stdio: 'inherit', cwd: join(__dirname, '../apps/backend') }
);

// Geçici dosyayı temizle
import { unlinkSync } from 'fs';
unlinkSync(sqlPath);

console.log('\nImport tamamlandi.');
console.log('Anlamlari doldurmak icin: scripts/curated-words.json dosyasini duzenle.');
