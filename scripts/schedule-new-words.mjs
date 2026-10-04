import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

function queryRemote(sql) {
  const out = execSync(
    `wrangler d1 execute harfhane-db --remote --command="${sql.replace(/"/g, '\\"')}"`,
    { cwd: '$CLAUDE_PROJECT_DIR/apps/backend', encoding: 'utf8' }
  );
  const json = JSON.parse(out.match(/\[[\s\S]*\]/)[0]);
  return json[0].results;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Son scheduled tarihler
const lastDates = queryRemote(
  'SELECT length, MAX(date) as last_date FROM daily_words GROUP BY length'
);
const lastDateMap = {};
for (const row of lastDates) lastDateMap[row.length] = row.last_date;

console.log('Son tarihler:', lastDateMap);

// Unscheduled kelimeler
const unscheduled = queryRemote(
  `SELECT w.id, w.length FROM words w WHERE w.is_active=1 AND NOT EXISTS (SELECT 1 FROM daily_words dw WHERE dw.word_id = w.id) ORDER BY w.length, w.id`
);

const byLength = {};
for (const row of unscheduled) {
  if (!byLength[row.length]) byLength[row.length] = [];
  byLength[row.length].push(row.id);
}

for (const [len, ids] of Object.entries(byLength)) {
  console.log(`${len}H: ${ids.length} kelime`);
}

// INSERT satırları üret
const rows = [];
const cursors = { ...lastDateMap };

for (const [len, ids] of Object.entries(byLength)) {
  for (const id of ids) {
    cursors[len] = addDays(cursors[len], 1);
    rows.push(`(${id}, '${cursors[len]}', ${len})`);
  }
}

const sql = `-- Yeni kelimelerin daily schedule'a eklenmesi
-- Oluşturulma: ${new Date().toISOString().slice(0, 10)}
-- Toplam: ${rows.length} yeni günlük kelime

INSERT OR IGNORE INTO daily_words (word_id, date, length) VALUES
${rows.join(',\n')};
`;

writeFileSync('scripts/schedule-new-words.sql', sql);
console.log(`\nscripts/schedule-new-words.sql yazıldı (${rows.length} satır).`);

for (const [len, cursor] of Object.entries(cursors)) {
  console.log(`${len}H son tarih: ${cursor}`);
}
