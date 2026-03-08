/**
 * Risale-i Nur Kelime Scraper
 *
 * risaleoku.com'dan Türkçe metin çeker, 4-7 harflik kelimeleri filtreler,
 * anlam alanı boş bırakılmış kelimeler.json üretir.
 *
 * Kullanım:
 *   npx tsx scripts/scrape-words.ts
 *   npx tsx scripts/scrape-words.ts --min 4 --max 6 --target 100
 */

import { parse } from 'node-html-parser';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// CLI args
const args = process.argv.slice(2);
const getArg = (flag: string, fallback: number): number => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? parseInt(args[idx + 1] ?? String(fallback)) : fallback;
};
const MIN_LEN = getArg('--min', 4);
const MAX_LEN = getArg('--max', 7);
const TARGET = getArg('--target', 100);
const DELAY_MS = 1200; // sunucuya saygılı ol

// Taranacak sayfalar — sozler, mektubat, lemalar, sualar, barla
const PAGES = [
  '/oku/sozler/5',  '/oku/sozler/6',  '/oku/sozler/7',  '/oku/sozler/8',
  '/oku/sozler/9',  '/oku/sozler/10', '/oku/sozler/11', '/oku/sozler/12',
  '/oku/sozler/13', '/oku/sozler/14', '/oku/sozler/15', '/oku/sozler/16',
  '/oku/sozler/17', '/oku/sozler/18', '/oku/sozler/19', '/oku/sozler/20',
  '/oku/sozler/21', '/oku/sozler/22', '/oku/sozler/23', '/oku/sozler/24',
  '/oku/mektubat/100', '/oku/mektubat/101', '/oku/mektubat/102', '/oku/mektubat/103',
  '/oku/mektubat/104', '/oku/mektubat/105', '/oku/mektubat/106', '/oku/mektubat/107',
  '/oku/lemalar/200', '/oku/lemalar/201', '/oku/lemalar/202', '/oku/lemalar/203',
  '/oku/lemalar/204', '/oku/lemalar/205', '/oku/lemalar/206', '/oku/lemalar/207',
  '/oku/sualar/300',  '/oku/sualar/301',  '/oku/sualar/302',  '/oku/sualar/303',
  '/oku/sualar/304',  '/oku/sualar/305',  '/oku/sualar/306',  '/oku/sualar/307',
  '/oku/barla/400',   '/oku/barla/401',   '/oku/barla/402',   '/oku/barla/403',
];

const BASE = 'https://risaleoku.com';

// Türkçe büyük harf normalizasyonu
const TR_UPPER: Record<string, string> = {
  i: 'İ', ı: 'I', ğ: 'Ğ', ü: 'Ü', ş: 'Ş', ö: 'Ö', ç: 'Ç',
};
function toTurkishUpper(s: string): string {
  return s.replace(/[iığüşöç]/g, (c) => TR_UPPER[c] ?? c).toUpperCase();
}

// Sadece Türkçe harflerden oluşan kelime mi?
const TR_LETTERS = /^[A-ZÇĞİÖŞÜ]+$/;
function isValidTurkish(word: string): boolean {
  return TR_LETTERS.test(word);
}

// Arapça/Osmanlıca kökenli ama Türkçe yazılmış kelimeleri filtrele:
// Çok fazla art arda ünsüz içeren kelimeleri at (kaba filtre)
const VOWELS = new Set([...'AEIİOUÖÜ']);
function hasEnoughVowels(word: string): boolean {
  const vowelCount = [...word].filter((c) => VOWELS.has(c)).length;
  return vowelCount >= Math.floor(word.length / 3);
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NurdleBot/1.0; kelime arastirma)',
      'Accept-Language': 'tr-TR,tr;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.text();
}

function extractWords(html: string): string[] {
  const root = parse(html);

  // İçerik alanını bul — .field-item, .node__content, article, main
  const content =
    root.querySelector('.field-item') ??
    root.querySelector('.node__content') ??
    root.querySelector('article') ??
    root.querySelector('main') ??
    root;

  // Script, style, nav, header, footer'ı temizle
  for (const el of content.querySelectorAll('script, style, nav, header, footer, .sidebar')) {
    el.remove();
  }

  const text = content.text;

  // Kelimelere böl: Türkçe harf dizisi
  const raw = text.match(/[A-Za-zÇĞİÖŞÜçğışöü]+/g) ?? [];

  return raw
    .map((w) => toTurkishUpper(w))
    .filter((w) => w.length >= MIN_LEN && w.length <= MAX_LEN)
    .filter(isValidTurkish)
    .filter(hasEnoughVowels);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface ScrapedWord {
  word: string;
  length: number;
  meaning: string;
  context: string;
  category: 'isim' | 'sıfat' | 'fiil';
}

async function main(): Promise<void> {
  const outPath = join(__dirname, 'scraped-words.json');

  // Daha önce çekilmişleri yükle (kaldığı yerden devam)
  const existing = new Map<string, ScrapedWord>();
  if (existsSync(outPath)) {
    const prev: ScrapedWord[] = JSON.parse(readFileSync(outPath, 'utf-8'));
    for (const w of prev) existing.set(w.word, w);
    console.log(`Mevcut: ${existing.size} kelime yüklendi.`);
  }

  const seen = new Set<string>(existing.keys());

  console.log(`Hedef: ${TARGET} kelime | Uzunluk: ${MIN_LEN}-${MAX_LEN} harf\n`);

  for (const path of PAGES) {
    if (seen.size >= TARGET) break;

    const url = BASE + path;
    process.stdout.write(`Çekiliyor: ${url} ... `);

    try {
      const html = await fetchPage(url);
      const words = extractWords(html);

      let added = 0;
      for (const word of words) {
        if (seen.has(word)) continue;
        seen.add(word);
        existing.set(word, {
          word,
          length: word.length,
          meaning: '',    // manuel doldurulacak
          context: '',
          category: 'isim',
        });
        added++;
        if (seen.size >= TARGET) break;
      }

      console.log(`${words.length} kelime bulundu, ${added} yeni eklendi. (Toplam: ${seen.size})`);
    } catch (err) {
      console.log(`HATA: ${(err as Error).message}`);
    }

    if (seen.size < TARGET) await sleep(DELAY_MS);
  }

  // Uzunluğa göre grupla ve sırala
  const result = [...existing.values()].sort((a, b) => a.length - b.length || a.word.localeCompare(b.word, 'tr'));

  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

  // Özet
  const byLength: Record<number, number> = {};
  for (const w of result) byLength[w.length] = (byLength[w.length] ?? 0) + 1;

  console.log('\n--- Ozet ---');
  for (const [len, cnt] of Object.entries(byLength).sort()) {
    console.log(`  ${len} harf: ${cnt} kelime`);
  }
  console.log(`  TOPLAM: ${result.length} kelime`);
  console.log(`\nKaydedildi: ${outPath}`);
  console.log('Sonraki adim: meaning alanlari doldur, sonra DB ye yukle.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
