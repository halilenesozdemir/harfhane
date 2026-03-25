import { writeFileSync } from 'fs';

const DELAY_MS = 150;
const TARGET_COUNT = { 4: 80, 5: 60, 6: 60 };

function turkishUpper(w) {
  return w.replace(/i/g, 'İ').replace(/ı/g, 'I').replace(/ğ/g, 'Ğ')
    .replace(/ü/g, 'Ü').replace(/ö/g, 'Ö').replace(/ş/g, 'Ş')
    .replace(/ç/g, 'Ç').toUpperCase();
}

function turkishLen(w) { return [...w].length; }

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function fetchTDK(word) {
  try {
    const res = await fetch(`https://sozluk.gov.tr/gts?ara=${encodeURIComponent(word)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data[0]?.anlamlarListe?.[0]) return null;
    const entry = data[0];
    const meaning = entry.anlamlarListe[0].anlam?.trim();
    if (!meaning) return null;
    return { word: turkishUpper(entry.madde), meaning, length: turkishLen(entry.madde) };
  } catch { return null; }
}

// tdk_words listesinden rastgele kelimeler seç, TDK'da anlamı olanları al
const response = await fetch('https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt');
const text = await response.text();
const TURKISH_CHARS = /^[abcçdefgğhıijklmnoöprsştuüvyz]+$/;

const allWords = text.split('\n').map((w) => w.trim().toLowerCase()).filter((w) => {
  if (!w || w.includes(' ') || w.includes('-') || w.includes("'")) return false;
  if (/[A-ZÇŞĞÖÜI]/.test(w.charAt(0))) return false;
  const len = turkishLen(w);
  if (![4, 5, 6].includes(len)) return false;
  return TURKISH_CHARS.test(w);
});

// Shuffle
for (let i = allWords.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
}

const results = { 4: [], 5: [], 6: [] };
let checked = 0;

for (const word of allWords) {
  const len = turkishLen(word);
  if (results[len].length >= TARGET_COUNT[len]) continue;

  const entry = await fetchTDK(word);
  checked++;

  if (entry && entry.meaning.length > 5) {
    results[len].push(entry);
    process.stdout.write(`[${len}H] ${entry.word}: ${entry.meaning.slice(0, 40)}\n`);
  }

  if (checked % 20 === 0) {
    process.stdout.write(`Kontrol: ${checked} | 4H:${results[4].length} 5H:${results[5].length} 6H:${results[6].length}\n`);
  }

  const total = results[4].length + results[5].length + results[6].length;
  const needed = TARGET_COUNT[4] + TARGET_COUNT[5] + TARGET_COUNT[6];
  if (total >= needed) break;

  await sleep(DELAY_MS);
}

const all = [...results[4], ...results[5], ...results[6]];
console.log(`\nToplam yeni kelime: ${all.length}`);

const today = new Date().toISOString().slice(0, 10);

// words tablosu için SQL
const wordInserts = all.map((e) =>
  `('${e.word.replace(/'/g, "''")}', '${e.meaning.replace(/'/g, "''")}', '', 'isim', ${e.length})`
).join(',\n');

// Schedule: boş günlere doldur
const scheduleInserts = all.map((e, i) => {
  const base = new Date('2026-07-01');
  base.setDate(base.getDate() + i);
  const date = base.toISOString().slice(0, 10);
  return `(last_insert_rowid() - ${all.length - 1 - i}, '${date}', ${e.length})`;
}).join(',\n');

const sql = `-- Yeni cevap kelimeleri — ${today}
-- Toplam: ${all.length} (4H:${results[4].length}, 5H:${results[5].length}, 6H:${results[6].length})

INSERT OR IGNORE INTO words (word, meaning, context, category, length) VALUES
${wordInserts};

INSERT OR IGNORE INTO tdk_words (word, length)
SELECT word, length FROM words WHERE word IN (${all.map((e) => `'${e.word.replace(/'/g, "''")}'`).join(',')});
`;

writeFileSync('scripts/new-words.sql', sql);
console.log('scripts/new-words.sql yazıldı.');
