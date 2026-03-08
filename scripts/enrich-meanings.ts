/**
 * TDK API anlam zenginleştirme scripti
 *
 * DB'deki boş anlamlı kelimeleri TDK Güncel Sözlük API'sinden doldurur.
 * Bulunamayanları atlar.
 *
 * Kullanım:
 *   npx tsx scripts/enrich-meanings.ts          # local
 *   npx tsx scripts/enrich-meanings.ts --remote  # production
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = join(__dirname, '../apps/backend');
const DELAY_MS = 400;

const isRemote = process.argv.includes('--remote');
const flag = isRemote ? '--remote' : '--local';

interface TdkAnlam {
  anlam: string;
  ozelliklerListe?: Array<{ tam_adi: string }>;
}
interface TdkEntry {
  anlamlarListe: TdkAnlam[];
}
type TdkResponse = TdkEntry[] | { error: string };

interface WordRow { id: number; word: string }

function query(sql: string): unknown[] {
  const out = execSync(
    `wrangler d1 execute nurdle-db ${flag} --json --command "${sql.replace(/"/g, '\\"')}"`,
    { cwd: BACKEND_DIR }
  ).toString();
  return (JSON.parse(out) as Array<{ results: unknown[] }>)[0]?.results ?? [];
}

function runSql(sqlPath: string): void {
  execSync(`wrangler d1 execute nurdle-db ${flag} --file=${sqlPath}`, {
    stdio: 'inherit',
    cwd: BACKEND_DIR,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchMeaning(word: string): Promise<{ meaning: string; category: string } | null> {
  const lower = word
    .replace(/İ/g, 'i').replace(/I/g, 'ı')
    .replace(/Ğ/g, 'ğ').replace(/Ü/g, 'ü')
    .replace(/Ş/g, 'ş').replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç').toLowerCase();

  const res = await fetch(`https://sozluk.gov.tr/gts?ara=${encodeURIComponent(lower)}`, {
    headers: { 'User-Agent': 'NurdleBot/1.0' },
  });
  const data = (await res.json()) as TdkResponse;

  if (!Array.isArray(data) || data.length === 0) return null;

  const entry = data[0];
  if (!entry?.anlamlarListe?.length) return null;

  const first = entry.anlamlarListe[0]!;
  const meaning = first.anlam.trim();
  const tamAdi = first.ozelliklerListe?.[0]?.tam_adi ?? '';

  let category: string = 'isim';
  if (tamAdi.toLowerCase().includes('fiil') || tamAdi.toLowerCase().includes('eylem')) category = 'fiil';
  else if (tamAdi.toLowerCase().includes('sıfat') || tamAdi.toLowerCase().includes('önad')) category = 'sıfat';

  return { meaning, category };
}

async function main(): Promise<void> {
  console.log(`TDK anlam zenginleştirme (${flag})\n`);

  const words = query(
    `SELECT id, word FROM words WHERE meaning = '' AND is_active = 1 ORDER BY length, word`
  ) as WordRow[];

  if (words.length === 0) {
    console.log('Tüm kelimelerin anlamı dolu.');
    return;
  }

  console.log(`${words.length} kelime işlenecek...\n`);

  let found = 0;
  let notFound = 0;
  const updates: string[] = [];

  for (const { id, word } of words) {
    process.stdout.write(`${word.padEnd(12)}`);

    try {
      const result = await fetchMeaning(word);
      if (result) {
        const esc = (s: string) => s.replace(/'/g, "''");
        updates.push(
          `UPDATE words SET meaning = '${esc(result.meaning)}', category = '${result.category}' WHERE id = ${id};`
        );
        console.log(`✓ ${result.meaning.slice(0, 60)}${result.meaning.length > 60 ? '...' : ''}`);
        found++;
      } else {
        console.log('— bulunamadı (TDK)');
        notFound++;
      }
    } catch {
      console.log('— hata');
      notFound++;
    }

    await sleep(DELAY_MS);
  }

  if (updates.length > 0) {
    const sqlPath = join(__dirname, '_enrich_tmp.sql');
    writeFileSync(sqlPath, updates.join('\n'), 'utf-8');
    console.log(`\n${found} kelime güncelleniyor...`);
    runSql(sqlPath);
    unlinkSync(sqlPath);
  }

  console.log(`\nTamamlandı: ${found} bulundu, ${notFound} bulunamadı.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
