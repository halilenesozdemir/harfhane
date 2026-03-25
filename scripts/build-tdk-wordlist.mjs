import { writeFileSync } from 'fs';

const TURKISH_CHARS = /^[abcçdefgğhıijklmnoöprsştuüvyz]+$/;
const TARGET_LENGTHS = [4, 5, 6];

function turkishLength(word) {
  return [...word].length;
}

function toTurkishUpper(word) {
  return word
    .replace(/i/g, 'İ').replace(/ı/g, 'I')
    .replace(/ğ/g, 'Ğ').replace(/ü/g, 'Ü')
    .replace(/ö/g, 'Ö').replace(/ş/g, 'Ş')
    .replace(/ç/g, 'Ç').toUpperCase();
}

const response = await fetch('https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt');
const text = await response.text();

const words = text
  .split('\n')
  .map((w) => w.trim().toLowerCase())
  .filter((w) => {
    if (!w || w.includes(' ') || w.includes('-') || w.includes("'")) return false;
    if (/[A-ZÇŞĞÖÜI]/.test(w.charAt(0))) return false; // özel isim
    const len = turkishLength(w);
    if (!TARGET_LENGTHS.includes(len)) return false;
    return TURKISH_CHARS.test(w);
  });

const byLength = { 4: 0, 5: 0, 6: 0 };
words.forEach((w) => byLength[turkishLength(w)]++);

console.log(`Toplam: ${words.length} kelime`);
console.log(`4 harf: ${byLength[4]}, 5 harf: ${byLength[5]}, 6 harf: ${byLength[6]}`);

const BATCH_SIZE = 400;
const rows = words.map((w) => `('${toTurkishUpper(w).replace(/'/g, "''")}', ${turkishLength(w)})`);

const batches = [];
for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  batches.push(rows.slice(i, i + BATCH_SIZE));
}

const statements = batches
  .map((batch) => `INSERT OR IGNORE INTO tdk_words (word, length) VALUES\n${batch.join(',\n')};`)
  .join('\n\n');

const sql = `-- TDK kelime listesi — validation dictionary
-- Kaynak: github.com/mertemin/turkish-word-list
-- Oluşturulma: ${new Date().toISOString().slice(0, 10)}
-- Toplam: ${words.length} kelime (4: ${byLength[4]}, 5: ${byLength[5]}, 6: ${byLength[6]})
-- ${batches.length} batch x ${BATCH_SIZE} satır

${statements}
`;

writeFileSync('scripts/tdk-wordlist.sql', sql);
console.log(`scripts/tdk-wordlist.sql yazıldı (${batches.length} batch).`);
