import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, X, Info } from 'lucide-react';
import * as api from '../../lib/admin-api';

interface ImportWordsProps {
  secret: string;
}

interface PreviewRow {
  word: string;
  meaning: string;
  context: string;
  category: string;
  error?: string;
}

const VALID_CATEGORIES = ['isim', 'sıfat', 'fiil'];

function parseCSV(text: string): PreviewRow[] {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  const firstLine = lines[0]?.toLowerCase() ?? '';
  const hasHeader = firstLine.includes('kelime') || firstLine.includes('word') || firstLine.includes('anlam');
  return (hasHeader ? lines.slice(1) : lines).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const [word = '', meaning = '', context = '', category = 'isim'] = cols;
    const errors: string[] = [];
    if (!word) errors.push('kelime boş');
    if (!meaning) errors.push('anlam boş');
    if (!VALID_CATEGORIES.includes(category)) errors.push(`geçersiz kategori`);
    return { word: word.toUpperCase(), meaning, context, category, error: errors.join(', ') || undefined };
  });
}

function parseJSON(text: string): PreviewRow[] {
  const data = JSON.parse(text) as unknown[];
  if (!Array.isArray(data)) throw new Error('JSON bir dizi olmalı');
  return data.map((item) => {
    const row = item as Record<string, unknown>;
    const word = String(row['word'] ?? row['kelime'] ?? '');
    const meaning = String(row['meaning'] ?? row['anlam'] ?? '');
    const context = String(row['context'] ?? row['baglan'] ?? row['bağlam'] ?? '');
    const category = String(row['category'] ?? row['kategori'] ?? 'isim');
    const errors: string[] = [];
    if (!word) errors.push('kelime boş');
    if (!meaning) errors.push('anlam boş');
    if (!VALID_CATEGORIES.includes(category)) errors.push('geçersiz kategori');
    return { word: word.toUpperCase(), meaning, context, category, error: errors.join(', ') || undefined };
  });
}

export default function ImportWords({ secret }: ImportWordsProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [showFormat, setShowFormat] = useState(false);

  const validRows = preview.filter((r) => !r.error);
  const invalidRows = preview.filter((r) => r.error);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    setParseError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        setPreview(file.name.endsWith('.json') ? parseJSON(text) : parseCSV(text));
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Dosya okunamadı');
        setPreview([]);
      }
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      processFile(file);
    } else {
      setParseError('Sadece .csv veya .json dosyaları desteklenir.');
    }
  }, [processFile]);

  const handleReset = () => {
    setPreview([]);
    setFileName('');
    setParseError('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    setParseError('');
    try {
      const res = await api.importWords(
        secret,
        validRows as { word: string; meaning: string; context: string; category: string }[]
      );
      setResult(res);
      handleReset();
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'İçe aktarılamadı');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">

      {/* Sonuç */}
      {result && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-tile-correct/10 border border-tile-correct/30 text-sm">
          <Check size={16} className="text-tile-correct flex-shrink-0" />
          <span className="text-text-primary">
            <strong>{result.inserted}</strong> kelime eklendi
            {result.skipped > 0 && <span className="text-text-secondary">, {result.skipped} zaten mevcuttu</span>}
          </span>
        </div>
      )}

      {/* Drop Zone */}
      {preview.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-tile-correct bg-tile-correct/10 scale-[1.01]'
              : 'border-border hover:border-tile-filled hover:bg-bg-secondary'
          }`}
        >
          <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-tile-correct/20' : 'bg-bg-secondary'}`}>
            <Upload size={28} className={isDragging ? 'text-tile-correct' : 'text-text-secondary'} />
          </div>
          <div className="text-center">
            <p className="text-text-primary font-medium">
              {isDragging ? 'Bırak!' : 'Dosyayı sürükle veya tıkla'}
            </p>
            <p className="text-text-secondary text-sm mt-1">CSV veya JSON · maks. 500 kelime</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.json" onChange={handleFile} className="hidden" />
        </div>
      )}

      {/* Format ipucu */}
      <button
        onClick={() => setShowFormat(v => !v)}
        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary cursor-pointer w-fit"
      >
        <Info size={12} /> Format nasıl olmalı?
      </button>

      {showFormat && (
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-bg-secondary border border-border text-xs">
          <div>
            <p className="font-medium text-text-primary mb-1.5">CSV</p>
            <pre className="bg-bg-primary p-2 rounded text-text-secondary leading-relaxed overflow-x-auto">{`kelime,anlam,bağlam,kategori
SABIR,Güçlüğe katlanma,,isim
İMAR,İnşa etme,,fiil`}</pre>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1.5">JSON</p>
            <pre className="bg-bg-primary p-2 rounded text-text-secondary leading-relaxed overflow-x-auto">{`[
  {
    "word": "SABIR",
    "meaning": "Güçlüğe katlanma",
    "category": "isim"
  }
]`}</pre>
          </div>
        </div>
      )}

      {parseError && (
        <div className="flex items-center gap-2 text-sm text-tile-absent">
          <AlertCircle size={15} /> {parseError}
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Üst bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={15} className="text-text-secondary" />
              <span className="text-sm text-text-primary font-medium">{fileName}</span>
              <span className="text-xs text-text-secondary">
                <span className="text-tile-correct">{validRows.length} geçerli</span>
                {invalidRows.length > 0 && <span className="text-tile-absent ml-1.5">{invalidRows.length} hatalı</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary cursor-pointer"
              >
                <X size={15} />
              </button>
              <button
                onClick={() => void handleImport()}
                disabled={validRows.length === 0 || importing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tile-correct text-white text-sm font-medium cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={14} />
                {importing ? 'Aktarılıyor...' : `${validRows.length} kelime aktar`}
              </button>
            </div>
          </div>

          {/* Tablo */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-y-auto max-h-80">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-bg-secondary border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-text-secondary font-medium w-28">Kelime</th>
                    <th className="text-left px-3 py-2.5 text-text-secondary font-medium">Anlam</th>
                    <th className="text-left px-3 py-2.5 text-text-secondary font-medium w-20">Kategori</th>
                    <th className="w-6 px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.slice(0, 200).map((row, i) => (
                    <tr key={i} className={row.error ? 'opacity-40' : ''}>
                      <td className="px-3 py-2 font-mono font-bold text-text-primary">{row.word || '—'}</td>
                      <td className="px-3 py-2 text-text-secondary">
                        {row.error
                          ? <span className="text-tile-absent">{row.error}</span>
                          : <span className="line-clamp-1">{row.meaning}</span>
                        }
                      </td>
                      <td className="px-3 py-2 text-text-secondary">{row.category}</td>
                      <td className="px-3 py-2 text-center">
                        {!row.error && <Check size={12} className="text-tile-correct inline" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 200 && (
                <p className="text-center text-xs text-text-secondary py-2">+{preview.length - 200} satır daha</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
