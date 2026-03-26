import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Plus, Search, Pencil, X, Wand2 } from 'lucide-react';
import * as api from '../../lib/admin-api';
import type { AdminDailyEntry, AdminWord } from '../../lib/admin-api';

interface DailySchedulerProps {
  secret: string;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function DailyScheduler({ secret }: DailySchedulerProps): React.JSX.Element {
  const [schedule, setSchedule] = useState<AdminDailyEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [from, setFrom] = useState(offsetStr(-7));
  const [to, setTo] = useState(offsetStr(30));

  const [wordSearch, setWordSearch] = useState('');
  const [wordResults, setWordResults] = useState<AdminWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<AdminWord | null>(null);
  const [scheduleDate, setScheduleDate] = useState(todayStr());
  const [scheduling, setScheduling] = useState(false);
  const [replacingEntry, setReplacingEntry] = useState<AdminDailyEntry | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillResult, setAutoFillResult] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listDailySchedule(secret, { from, to });
      setSchedule(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [secret, from, to]);

  useEffect(() => { void loadSchedule(); }, [loadSchedule]);

  const searchWords = useCallback(async () => {
    if (!wordSearch.trim()) { setWordResults([]); return; }
    try {
      const result = await api.listWords(secret, { search: wordSearch, limit: 10, active: '1' });
      setWordResults(result.words);
    } catch {
      setWordResults([]);
    }
  }, [secret, wordSearch]);

  useEffect(() => {
    const t = setTimeout(() => void searchWords(), 300);
    return () => clearTimeout(t);
  }, [searchWords]);

  const handleSchedule = async (): Promise<void> => {
    if (!selectedWord) return;
    setScheduling(true);
    setError('');
    try {
      await api.scheduleDailyWord(secret, selectedWord.id, scheduleDate);
      setSelectedWord(null);
      setWordSearch('');
      setWordResults([]);
      setReplacingEntry(null);
      await loadSchedule();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Programlanamadı');
    } finally {
      setScheduling(false);
    }
  };

  const startReplace = (entry: AdminDailyEntry): void => {
    setReplacingEntry(entry);
    setScheduleDate(entry.date);
    setSelectedWord(null);
    setWordSearch('');
    setWordResults([]);
    setError('');
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const cancelReplace = (): void => {
    setReplacingEntry(null);
    setScheduleDate(todayStr());
    setSelectedWord(null);
    setWordSearch('');
    setWordResults([]);
  };

  const handleRemove = async (id: number): Promise<void> => {
    if (!confirm('Bu günlük kelimeyi kaldırmak istediğinize emin misiniz?')) return;
    try {
      await api.removeDailyWord(secret, id);
      setSchedule((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaldırılamadı');
    }
  };

  const handleAutoFill = async (): Promise<void> => {
    if (!confirm('Sonraki 30 günün boş tarihleri rastgele kelimelerle doldurulsun mu?')) return;
    setAutoFilling(true);
    setAutoFillResult('');
    setError('');
    try {
      const result = await api.autoFillSchedule(secret, 30);
      setAutoFillResult(`${result.scheduled} gün programlandı, ${result.skipped} gün zaten doluydu.`);
      await loadSchedule();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Otomatik doldurulamadı');
    } finally {
      setAutoFilling(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Schedule a word */}
      <div ref={formRef} className="p-4 rounded-xl bg-bg-secondary border border-border flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary text-sm">
            {replacingEntry
              ? `Değiştir: ${replacingEntry.date} — ${replacingEntry.word}`
              : 'Günlük Kelime Programla'}
          </h3>
          {replacingEntry && (
            <button onClick={cancelReplace} className="text-text-secondary hover:text-text-primary cursor-pointer">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-start">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Kelime ara..."
              value={wordSearch}
              onChange={(e) => { setWordSearch(e.target.value); setSelectedWord(null); }}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-tile-filled"
            />
            {wordResults.length > 0 && !selectedWord && (
              <div className="absolute top-full mt-1 w-full z-10 bg-bg-secondary border border-border rounded-lg shadow-lg overflow-hidden">
                {wordResults.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => { setSelectedWord(w); setWordSearch(w.word); setWordResults([]); }}
                    className="w-full text-left px-4 py-2 hover:bg-bg-primary text-sm text-text-primary cursor-pointer"
                  >
                    <span className="font-mono font-bold">{w.word}</span>
                    <span className="text-text-secondary ml-2">{w.meaning}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => { setScheduleDate(e.target.value); setReplacingEntry(null); }}
            disabled={!!replacingEntry}
            className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled cursor-pointer disabled:opacity-50"
          />
          <button
            onClick={() => void handleSchedule()}
            disabled={!selectedWord || scheduling}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40"
          >
            <Plus size={16} /> {scheduling ? 'Kaydediliyor...' : replacingEntry ? 'Değiştir' : 'Programla'}
          </button>
        </div>
        {selectedWord && (
          <p className="text-xs text-green-400">
            Seçili: <span className="font-mono font-bold">{selectedWord.word}</span> — {selectedWord.meaning}
          </p>
        )}
      </div>

      {/* Auto-fill */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => void handleAutoFill()}
          disabled={autoFilling}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm font-medium cursor-pointer hover:bg-bg-primary disabled:opacity-40 transition-colors"
        >
          <Wand2 size={15} />
          {autoFilling ? 'Dolduruluyor...' : 'Otomatik Doldur (30 gün)'}
        </button>
        {autoFillResult && <span className="text-sm text-green-400">{autoFillResult}</span>}
      </div>

      {/* Date range filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm text-text-secondary">Tarih aralığı:</span>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none cursor-pointer"
        />
        <span className="text-text-secondary">—</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none cursor-pointer"
        />
      </div>

      {error && <p className="text-sm text-tile-absent">{error}</p>}

      {/* Schedule table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Tarih</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Kelime</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Anlam</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Kategori</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-text-secondary">Yükleniyor...</td></tr>
            ) : schedule.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-text-secondary">Bu aralıkta programlanmış kelime yok.</td></tr>
            ) : schedule.map((entry) => {
              const isPast = entry.date < todayStr();
              return (
                <tr key={entry.id} className={`border-b border-border last:border-0 hover:bg-bg-secondary transition-colors ${isPast ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-text-primary">
                    {entry.date}
                    {entry.date === todayStr() && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-tile-filled/20 text-tile-filled">Bugün</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-text-primary">{entry.word}</td>
                  <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{entry.meaning}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-bg-primary border border-border text-text-secondary text-xs">
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => startReplace(entry)}
                        className="p-1.5 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                        title="Kelimeyi değiştir"
                      >
                        <Pencil size={14} />
                      </button>
                      {!isPast && (
                        <button
                          onClick={() => void handleRemove(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-tile-absent/10 text-tile-absent cursor-pointer transition-colors"
                          title="Kaldır"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
