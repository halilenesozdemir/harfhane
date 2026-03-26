import { useEffect, useState } from 'react';
import { getWordStats, type WordStatRow } from '../../lib/admin-api';

interface WordStatsProps {
  secret: string;
}

type SortKey = 'played' | 'win_rate';

const SORT_LABELS: Record<SortKey, string> = {
  played: 'En çok oynanan',
  win_rate: 'En yüksek kazanma %',
};

export default function WordStats({ secret }: WordStatsProps): React.JSX.Element {
  const [rows, setRows] = useState<WordStatRow[]>([]);
  const [sort, setSort] = useState<SortKey>('played');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getWordStats(secret, sort)
      .then(setRows)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Yüklenemedi'))
      .finally(() => setLoading(false));
  }, [secret, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Kelime İstatistikleri (İlk 20)</h2>
        <div className="flex gap-1">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                sort === key
                  ? 'bg-correct text-white'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {SORT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-text-secondary text-sm py-8 text-center">Yükleniyor...</p>}
      {error && <p className="text-absent text-sm py-8 text-center">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-text-secondary text-sm py-8 text-center">Henüz oyun verisi yok.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="bg-bg-secondary border border-border-color rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-color text-text-secondary text-xs">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Kelime</th>
                <th className="px-4 py-3 text-right font-medium">Oynanan</th>
                <th className="px-4 py-3 text-right font-medium">Kazanma %</th>
                <th className="px-4 py-3 text-right font-medium">Ort. Deneme</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.word} className="border-b border-border-color last:border-0 hover:bg-bg-primary transition-colors">
                  <td className="px-4 py-3 text-text-secondary tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-text-primary tracking-wider">{row.word}</span>
                    <span className="block text-xs text-text-secondary truncate max-w-[200px]">{row.meaning}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-primary">{row.total_played}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={`font-semibold ${row.win_rate >= 50 ? 'text-correct' : 'text-present'}`}>
                      {row.win_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                    {row.avg_guesses ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
