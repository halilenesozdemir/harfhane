/**
 * Otomatik kelime import pipeline
 *
 * scraped-words.json → TDK doğrulama → DB insert → daily schedule
 *
 * Kullanım:
 *   npx tsx scripts/auto-import.ts          # local
 *   npx tsx scripts/auto-import.ts --remote  # production
 *
 * Filtreler:
 *   --min-len 4  --max-len 7  (varsayılan: 4-7)
 *   --target 50              (her uzunluk için hedef, varsayılan: 50)
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = join(__dirname, '../apps/backend');
const DELAY_MS = 350;

const args = process.argv.slice(2);
const isRemote = args.includes('--remote');
const flag = isRemote ? '--remote' : '--local';
const getArg = (name: string, fallback: number) => {
  const idx = args.indexOf(name);
  return idx !== -1 ? parseInt(args[idx + 1] ?? String(fallback)) : fallback;
};
const TARGET_PER_LENGTH = getArg('--target', 50);
const MIN_LEN = getArg('--min-len', 4);
const MAX_LEN = getArg('--max-len', 7);

// Türkçe küçük harf
const TR_LOWER: Record<string, string> = { İ:'i', I:'ı', Ğ:'ğ', Ü:'ü', Ş:'ş', Ö:'ö', Ç:'ç' };
function toLower(s: string): string {
  return s.replace(/[İIĞÜŞÖÇ]/g, c => TR_LOWER[c] ?? c).toLowerCase();
}

// Türkçe kelime çekim ekleri — bu eklerle biten kelimeler at
const BAD_SUFFIXES = [
  'NIN','NİN','NUN','NÜN','NDA','NDE','DAN','DEN','TAN','TEN',
  'YAN','YEN','YOR','MIŞ','MİŞ','MUŞ','MÜŞ','MAK','MEK',
  'LER','LAR','LIK','LİK','LUK','LÜK','SAL','SEL',
  'SIN','SİN','SUN','SÜN','DIM','DİM','DUM','DÜM',
  'TIM','TİM','TUM','TÜM','RIM','RİM','RUM','RÜM',
  'YIM','YİM','YUM','YÜM','LIM','LİM','LUM','LÜM',
  'CIK','CİK','CUK','CÜK','CAK','CEK',
  'DIR','DİR','DUR','DÜR','TIR','TİR','TUR','TÜR',
  'YLA','YLE','NLA','NLE','IYA','İYE',
  'ARAK','EREK','ARAK','INCE','İNCE',
];

// Site UI / yaygın bağlaç / gramer kelimeleri
const BAD_WORDS = new Set([
  'OLAN','OLUR','OLDU','EDER','ETTI','ETME','DAHI','GIBI','GİBİ','İÇİN',
  'İŞTE','DAHA','BILE','BELE','EVET','HAYIR','VEYA','YADA','AMMA','LAKIN',
  'BUDUR','ŞUDUR','ODUR','ÇIKIP','GIRIP','GIRDI','ÇIKTI','GITTI','GELDİ',
  'ATLA','EKLE','KAPAT','PAYLAŞ','KAYDIR','AYARLAR','KOPYALA','DOCTYPE',
  'ANDROİD','SISTEM','SAYFAYA','SİSTEMİ','RENK','MODU','TİME',
  'AİKİNCİ','AONUNCU','AÜÇÜNCÜ','BİRİNCİ','İKİNCİ','ÜÇÜNCÜ','DÖRDÜNCÜ',
  'BEŞİNCİ','ALTINCI','YEDİNCİ','SEKIZINCI','ONUNCU',
  'BENDEN','GİRSİN','ALMADI','YETTEN','YECİĞE','METLE','TIYLA',
]);

function isBadWord(word: string): boolean {
  if (BAD_WORDS.has(word)) return true;
  if (BAD_SUFFIXES.some(s => word.endsWith(s) && word.length > s.length + 1)) return true;
  return false;
}

interface ScrapedWord { word: string; length: number }
interface TdkAnlam { anlam: string; ozelliklerListe?: Array<{ tam_adi: string }> }
interface TdkEntry { anlamlarListe: TdkAnlam[] }
type TdkResponse = TdkEntry[] | { error: string };

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchTdk(word: string): Promise<{ meaning: string; category: string } | null> {
  try {
    const lower = toLower(word);
    const res = await fetch(`https://sozluk.gov.tr/gts?ara=${encodeURIComponent(lower)}`, {
      headers: { 'User-Agent': 'HarfhaneBot/1.0' },
    });
    const data = await res.json() as TdkResponse;
    if (!Array.isArray(data) || !data[0]?.anlamlarListe?.length) return null;
    const first = data[0].anlamlarListe[0]!;
    const tamAdi = first.ozelliklerListe?.[0]?.tam_adi?.toLowerCase() ?? '';
    let category = 'isim';
    if (tamAdi.includes('fiil') || tamAdi.includes('eylem')) category = 'fiil';
    else if (tamAdi.includes('sıfat') || tamAdi.includes('önad')) category = 'sıfat';
    return { meaning: first.anlam.trim(), category };
  } catch {
    return null;
  }
}

function dbQuery(sql: string): unknown[] {
  const out = execSync(
    `wrangler d1 execute harfhane-db ${flag} --json --command "${sql.replace(/"/g, '\\"')}"`,
    { cwd: BACKEND_DIR }
  ).toString();
  return (JSON.parse(out) as Array<{ results: unknown[] }>)[0]?.results ?? [];
}

function runFile(sqlPath: string): void {
  execSync(`wrangler d1 execute harfhane-db ${flag} --file=${sqlPath}`, {
    stdio: 'inherit', cwd: BACKEND_DIR,
  });
}

async function main(): Promise<void> {
  console.log(`Auto-import pipeline (${flag}) | hedef: ${TARGET_PER_LENGTH} kelime/uzunluk\n`);

  // DB'deki mevcut kelimeler
  const existing = new Set(
    (dbQuery('SELECT word FROM words') as Array<{ word: string }>).map(r => r.word)
  );
  console.log(`Mevcut DB: ${existing.size} kelime\n`);

  // Scraped aday havuzu
  const scraped: ScrapedWord[] = JSON.parse(
    readFileSync(join(__dirname, 'scraped-words.json'), 'utf-8')
  );

  // Her uzunluk için kaç tane daha lazım
  const currentCounts: Record<number, number> = {};
  for (const w of existing) {
    const l = [...w].length; // Unicode-safe
    currentCounts[l] = (currentCounts[l] ?? 0) + 1;
  }

  const toProcess: Record<number, string[]> = {};
  for (let l = MIN_LEN; l <= MAX_LEN; l++) {
    const current = currentCounts[l] ?? 0;
    const needed = Math.max(0, TARGET_PER_LENGTH - current);
    if (needed === 0) { console.log(`${l} harf: zaten ${current} kelime var, atlanıyor.`); continue; }

    const candidates = scraped
      .filter(w => w.length === l && !existing.has(w.word) && !isBadWord(w.word))
      .map(w => w.word);

    toProcess[l] = candidates.slice(0, needed * 3); // fazladan al, TDK'da bulunamayanlar için buffer
    console.log(`${l} harf: ${current} mevcut → ${needed} lazım | ${candidates.length} aday`);
  }

  console.log('');

  const inserts: string[] = [];
  const dailyInserts: Record<number, string[]> = {};
  const esc = (s: string) => s.replace(/'/g, "''");
  let totalAdded = 0;

  for (const [lenStr, candidates] of Object.entries(toProcess)) {
    const len = parseInt(lenStr);
    const needed = TARGET_PER_LENGTH - (currentCounts[len] ?? 0);
    let added = 0;
    dailyInserts[len] = [];

    console.log(`\n[${len} harf] işleniyor...`);

    for (const word of candidates) {
      if (added >= needed) break;

      process.stdout.write(`  ${word.padEnd(12)}`);
      const tdk = await fetchTdk(word);

      if (tdk) {
        inserts.push(
          `INSERT OR IGNORE INTO words (word, meaning, context, category, length) VALUES ('${esc(word)}', '${esc(tdk.meaning)}', '', '${tdk.category}', ${len});`
        );
        dailyInserts[len]!.push(word);
        console.log(`✓ ${tdk.meaning.slice(0, 55)}${tdk.meaning.length > 55 ? '...' : ''}`);
        added++;
        totalAdded++;
      } else {
        console.log('— TDK yok, atlandı');
      }

      await sleep(DELAY_MS);
    }

    console.log(`  → ${added} kelime eklendi`);
  }

  if (inserts.length === 0) {
    console.log('\nEklenecek kelime yok.');
    return;
  }

  // DB'ye yaz
  const insertPath = join(__dirname, '_auto_insert_tmp.sql');
  writeFileSync(insertPath, inserts.join('\n'), 'utf-8');
  console.log(`\n${totalAdded} kelime DB''ye ekleniyor...`);
  runFile(insertPath);
  unlinkSync(insertPath);

  // Daily schedule — yeni eklenenler için
  console.log('\nGünlük atama yapılıyor...');
  for (const [lenStr, words] of Object.entries(dailyInserts)) {
    const len = parseInt(lenStr);
    if (!words.length) continue;

    const lastDates = dbQuery(
      `SELECT MAX(date) as date FROM daily_words WHERE length = ${len}`
    ) as Array<{ date: string | null }>;
    const rawDate = lastDates[0]?.date ?? null;
    const lastDate = rawDate && rawDate !== 'null' ? rawDate : null;
    const startDate = lastDate
      ? new Date(lastDate + 'T00:00:00Z')
      : new Date('2026-01-01T00:00:00Z');
    startDate.setUTCDate(startDate.getUTCDate() + 1);

    const scheduleInserts: string[] = [];
    words.forEach((word, i) => {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      scheduleInserts.push(
        `INSERT OR IGNORE INTO daily_words (word_id, date, length) SELECT id, '${dateStr}', ${len} FROM words WHERE word = '${esc(word)}';`
      );
    });

    const schedulePath = join(__dirname, `_schedule_${len}_tmp.sql`);
    writeFileSync(schedulePath, scheduleInserts.join('\n'), 'utf-8');
    runFile(schedulePath);
    unlinkSync(schedulePath);
    console.log(`  ${len} harf: ${words.length} gün eklendi`);
  }

  // Özet
  console.log('\n=== SONUÇ ===');
  const summary = dbQuery(
    'SELECT length, COUNT(*) as cnt FROM daily_words GROUP BY length ORDER BY length'
  ) as Array<{ length: number; cnt: number }>;
  for (const r of summary) console.log(`  ${r.length} harf: ${r.cnt} günlük kelime`);
}

main().catch(e => { console.error(e); process.exit(1); });
