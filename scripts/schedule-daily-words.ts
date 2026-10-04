/**
 * Daily words scheduler
 *
 * Belirli bir kelime uzunluğu için daily_words tablosuna tarih ataması yapar.
 * Zaten atanmış kelimeleri atlar. Rastgele sırayla dağıtır.
 *
 * Kullanım:
 *   npx tsx scripts/schedule-daily-words.ts --length 4          # local
 *   npx tsx scripts/schedule-daily-words.ts --length 6 --remote # production
 *   npx tsx scripts/schedule-daily-words.ts --all --remote       # tüm uzunluklar
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = join(__dirname, '../apps/backend');

const args = process.argv.slice(2);
const isRemote = args.includes('--remote');
const doAll = args.includes('--all');
const flag = isRemote ? '--remote' : '--local';

function getArg(name: string): number | null {
  const idx = args.indexOf(name);
  return idx !== -1 ? parseInt(args[idx + 1] ?? '') : null;
}

function query(sql: string): unknown[] {
  const result = execSync(
    `wrangler d1 execute harfhane-db ${flag} --json --command "${sql.replace(/"/g, '\\"')}"`,
    { cwd: BACKEND_DIR }
  ).toString();
  const parsed = JSON.parse(result) as Array<{ results: unknown[] }>;
  return parsed[0]?.results ?? [];
}

function execSql(sqlPath: string): void {
  execSync(`wrangler d1 execute harfhane-db ${flag} --file=${sqlPath}`, {
    stdio: 'inherit',
    cwd: BACKEND_DIR,
  });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface WordRow { id: number; word: string }
interface DailyRow { date: string }

async function scheduleLength(length: number): Promise<void> {
  console.log(`\n--- ${length} harf ---`);

  // Bu uzunluğa ait aktif kelimeler
  const words = query(
    `SELECT id, word FROM words WHERE length = ${length} AND is_active = 1`
  ) as WordRow[];

  if (words.length === 0) {
    console.log('  Kelime yok, atlanıyor.');
    return;
  }

  // Zaten atanmış word_id'leri
  const assigned = query(
    `SELECT word_id FROM daily_words WHERE length = ${length}`
  ) as Array<{ word_id: number }>;
  const assignedIds = new Set(assigned.map((r) => r.word_id));

  // Atanmamış kelimeler
  const unassigned = words.filter((w) => !assignedIds.has(w.id));
  if (unassigned.length === 0) {
    console.log('  Tüm kelimeler zaten atanmış.');
    return;
  }

  // Bu uzunluk için son kullanılan tarih
  const lastDates = query(
    `SELECT MAX(date) as date FROM daily_words WHERE length = ${length}`
  ) as DailyRow[];
  const rawDate = (lastDates[0] as { date: string | null } | undefined)?.date ?? null;
  const lastDate = rawDate && rawDate !== 'null' ? rawDate : null;

  // Başlangıç tarihi: son atamadan bir gün sonra veya 2026-01-01
  const startDate = lastDate
    ? addDays(new Date(lastDate + 'T00:00:00Z'), 1)
    : new Date('2026-01-01T00:00:00Z');

  const shuffled = shuffle(unassigned);
  const inserts: string[] = [];

  shuffled.forEach((w, i) => {
    const d = dateStr(addDays(startDate, i));
    inserts.push(
      `INSERT OR IGNORE INTO daily_words (word_id, date, length) VALUES (${w.id}, '${d}', ${length});`
    );
  });

  console.log(`  ${shuffled.length} kelime → ${dateStr(startDate)} tarihinden itibaren`);

  const sqlPath = join(__dirname, `_schedule_${length}_tmp.sql`);
  writeFileSync(sqlPath, inserts.join('\n'), 'utf-8');
  execSql(sqlPath);
  unlinkSync(sqlPath);

  console.log(`  Tamamlandı.`);
}

async function main(): Promise<void> {
  const lengths = doAll ? [4, 5, 6, 7] : [getArg('--length') ?? 5];

  console.log(`Hedef: ${lengths.join(', ')} harf | ${flag}`);

  for (const len of lengths) {
    await scheduleLength(len);
  }

  console.log('\nSonuç:');
  const summary = query(
    `SELECT length, COUNT(*) as cnt FROM daily_words GROUP BY length ORDER BY length`
  ) as Array<{ length: number; cnt: number }>;
  for (const row of summary) {
    console.log(`  ${row.length} harf: ${row.cnt} gün`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
