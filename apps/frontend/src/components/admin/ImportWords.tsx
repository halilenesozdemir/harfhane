import { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
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
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const [word = '', meaning = '', context = '', category = 'isim'] = cols;
    const errors: string[] = [];
    if (!word) errors.push('kelime boş');
    if (!meaning) errors.push('anlam boş');
    if (!VALID_CATEGORIES.includes(category)) errors.push(`geçersiz kategori: ${category}`);
    return { word, meaning, context, category, error: errors.join(', ') || undefined };
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
    if (!VALID_CATEGORIES.includes(category)) errors.push(`geçersiz kategori: ${category}`);
    return { word, meaning, context, category, error: errors.join(', ') || undefined };
  });
}

export default function ImportWords({ secret }: ImportWordsProps): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);

  const validRows = preview.filter((r) => !r.error);
  const invalidRows = preview.filter((r) => r.error);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const rows = file.name.endsWith('.json') ? parseJSON(text) : parseCSV(text);
        setPreview(rows);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : 'Dosya okunamadı');
        setPreview([]);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async (): Promise<void> => {
    if (validRows.length === 0) return;
    setImporting(true);
    setParseError('');
    try {
      const res = await api.importWords(secret, validRows as { word: string; meaning: string; context: string; category: string }[]);
      setResult(res);
      setPreview([]);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'İçe aktarılamadı');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Format info */}
      <div className="p-4 rounded-xl bg-bg-secondary border border-border flex flex-col gap-2">
        <h3 className="font-semibold text-text-primary text-sm">Desteklenen Formatlar</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-text-secondary">
          <div>
            <p className="font-medium text-text-primary mb-1">CSV</p>
            <code className="block bg-bg-primary p-2 rounded text-xs">
              kelime,anlam,bağlam,kategori<br />
              KALEM,Yazma aleti,Kalemi aldı,isim
            </code>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-1">JSON</p>
            <code className="block bg-bg-primary p-2 rounded text-xs">
              {`[{"word":"KALEM","meaning":"Yazma aleti","context":"","category":"isim"}]`}
            </code>
          </div>
        </div>
      </div>

      {/* File upload */}
      <div
        className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-border hover:border-tile-filled transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={24} className="text-text-secondary" />
        <p className="text-text-secondary text-sm">
          {fileName ? (
            <span className="flex items-center gap-2 text-text-primary">
              <FileText size={16} /> {fileName}
            </span>
          ) : 'CSV veya JSON dosyası seç'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-sm text-tile-absent">
          <AlertCircle size={16} /> {parseError}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <Check size={16} />
          {result.inserted} kelime eklendi, {result.skipped} atlandı (zaten mevcut).
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {preview.length} satır — <span className="text-green-400">{validRows.length} geçerli</span>
              {invalidRows.length > 0 && <span className="text-tile-absent ml-1">{invalidRows.length} hatalı (atlanacak)</span>}
            </p>
            <button
              onClick={() => void handleImport()}
              disabled={validRows.length === 0 || importing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40"
            >
              <Upload size={16} /> {importing ? 'Aktarılıyor...' : `${validRows.length} Kelimeyi Aktar`}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-bg-secondary">
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-text-secondary font-medium">Kelime</th>
                  <th className="text-left px-3 py-2 text-text-secondary font-medium">Anlam</th>
                  <th className="text-left px-3 py-2 text-text-secondary font-medium">Kategori</th>
                  <th className="text-left px-3 py-2 text-text-secondary font-medium">Durum</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 100).map((row, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${row.error ? 'opacity-50' : ''}`}>
                    <td className="px-3 py-2 font-mono font-bold text-text-primary">{row.word || '—'}</td>
                    <td className="px-3 py-2 text-text-secondary truncate max-w-xs">{row.meaning || '—'}</td>
                    <td className="px-3 py-2 text-text-secondary">{row.category}</td>
                    <td className="px-3 py-2">
                      {row.error ? (
                        <span className="text-tile-absent">{row.error}</span>
                      ) : (
                        <span className="text-green-400">Geçerli</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
