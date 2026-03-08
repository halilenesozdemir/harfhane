import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface WordEntry {
  word: string;
  meaning: string;
  context: string;
  category: 'isim' | 'sıfat' | 'fiil';
}

interface WordData {
  dailyWords: WordEntry[];
  validWords: string[];
}

const wordsPath = join(__dirname, '../src/data/words.json');
const data: WordData = JSON.parse(readFileSync(wordsPath, 'utf-8'));

const isRemote = process.argv.includes('--remote');
const flag = isRemote ? '--remote' : '--local';

console.log(`Seeding ${flag} D1 database...`);
console.log(`Found ${data.dailyWords.length} daily words`);
console.log(`Found ${data.validWords.length} valid words`);

const allWords = new Map<string, WordEntry>();

for (const entry of data.dailyWords) {
  allWords.set(entry.word.toUpperCase(), entry);
}

for (const word of data.validWords) {
  const upper = word.toUpperCase();
  if (!allWords.has(upper)) {
    allWords.set(upper, {
      word: upper,
      meaning: '',
      context: '',
      category: 'isim',
    });
  }
}

const insertWords = Array.from(allWords.values())
  .map(({ word, meaning, context, category }) => {
    const escaped = (s: string) => s.replace(/'/g, "''");
    return `INSERT OR IGNORE INTO words (word, meaning, context, category) VALUES ('${escaped(word)}', '${escaped(meaning)}', '${escaped(context)}', '${escaped(category)}');`;
  })
  .join('\n');

const insertDailyWords = data.dailyWords
  .map((entry, index) => {
    const date = new Date(2026, 0, 1);
    date.setDate(date.getDate() + index);
    const dateStr = date.toISOString().slice(0, 10);
    const word = entry.word.toUpperCase().replace(/'/g, "''");
    return `INSERT OR IGNORE INTO daily_words (word_id, date) SELECT id, '${dateStr}' FROM words WHERE word = '${word}';`;
  })
  .join('\n');

const sql = `${insertWords}\n${insertDailyWords}`;

execSync(
  `echo '${sql.replace(/'/g, "'\\''")}' | wrangler d1 execute nurdle-db ${flag} --command "$(cat -)"`,
  { stdio: 'inherit', cwd: join(__dirname, '../apps/backend') }
);

console.log('Seed completed.');
