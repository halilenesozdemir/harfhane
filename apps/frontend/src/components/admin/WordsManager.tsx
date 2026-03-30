import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Check, X, ChevronLeft, ChevronRight, ArrowUpAZ } from 'lucide-react';
import * as api from '../../lib/admin-api';
import type { AdminWord } from '../../lib/admin-api';

interface WordsManagerProps {
  secret: string;
}

type Category = 'isim' | 'sıfat' | 'fiil';
const CATEGORIES: Category[] = ['isim', 'sıfat', 'fiil'];
const LENGTHS = [4, 5, 6] as const;

const emptyForm = { word: '', meaning: '', context: '', category: 'isim' as Category };

export default function WordsManager({ secret }: WordsManagerProps): React.JSX.Element {
  const [words, setWords] = useState<AdminWord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [lengthFilter, setLengthFilter] = useState<number | undefined>(undefined);
  const [sortAZ, setSortAZ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.listWords(secret, {
        page,
        limit: LIMIT,
        search: search || undefined,
        category: categoryFilter || undefined,
        active: (activeFilter as '0' | '1') || undefined,
        length: lengthFilter,
        sort: sortAZ ? 'az' : 'id_desc',
      });
      setWords(result.words);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [secret, page, search, categoryFilter, activeFilter, lengthFilter, sortAZ]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setError('');
    try {
      if (editingId !== null) {
        const updated = await api.updateWord(secret, editingId, form);
        setWords((prev) => prev.map((w) => (w.id === editingId ? updated : w)));
      } else {
        await api.createWord(secret, form);
        setPage(1);
        await load();
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (word: AdminWord): Promise<void> => {
    try {
      const updated = await api.toggleWordActive(secret, word.id, word.is_active === 0);
      setWords((prev) => prev.map((w) => (w.id === word.id ? updated : w)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncellenemedi');
    }
  };

  const startEdit = (word: AdminWord): void => {
    setEditingId(word.id);
    setForm({ word: word.word, meaning: word.meaning, context: word.context, category: word.category });
    setShowForm(true);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Kelime veya anlam ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:border-tile-filled"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none cursor-pointer"
        >
          <option value="">Tüm kategoriler</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none cursor-pointer"
        >
          <option value="">Tümü</option>
          <option value="1">Aktif</option>
          <option value="0">Pasif</option>
        </select>
        {/* Length filter */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-primary p-1">
          <button
            onClick={() => { setLengthFilter(undefined); setPage(1); }}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${lengthFilter === undefined ? 'bg-tile-filled text-white' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Tümü
          </button>
          {LENGTHS.map((l) => (
            <button
              key={l}
              onClick={() => { setLengthFilter(lengthFilter === l ? undefined : l); setPage(1); }}
              className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${lengthFilter === l ? 'bg-tile-filled text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {l}
            </button>
          ))}
        </div>
        {/* A-Z sort toggle */}
        <button
          onClick={() => { setSortAZ((s) => !s); setPage(1); }}
          title={sortAZ ? 'A-Z sıralı' : 'Son eklenen'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${sortAZ ? 'border-tile-filled bg-tile-filled/10 text-tile-filled' : 'border-border text-text-secondary hover:text-text-primary'}`}
        >
          <ArrowUpAZ size={15} /> A-Z
        </button>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90"
        >
          <Plus size={16} /> Kelime Ekle
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-4 rounded-xl bg-bg-secondary border border-border flex flex-col gap-3">
          <h3 className="font-semibold text-text-primary text-sm">
            {editingId !== null ? 'Kelimeyi Düzenle' : 'Yeni Kelime'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Kelime</span>
              <input
                value={form.word}
                onChange={(e) => setForm((f) => ({ ...f, word: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Kategori</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
                className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Anlam</span>
              <input
                value={form.meaning}
                onChange={(e) => setForm((f) => ({ ...f, meaning: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Örnek cümle <span className="font-normal opacity-60">(opsiyonel)</span></span>
              <input
                value={form.context}
                onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
                className="px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:outline-none focus:border-tile-filled"
              />
            </label>
          </div>
          {error && <p className="text-xs text-tile-absent">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setError(''); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-text-secondary text-sm cursor-pointer hover:text-text-primary"
            >
              <X size={14} /> İptal
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-tile-filled text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              <Check size={14} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !showForm && <p className="text-sm text-tile-absent">{error}</p>}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Kelime</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Anlam</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Kategori</th>
              <th className="text-left px-4 py-3 text-text-secondary font-medium">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-text-secondary">Yükleniyor...</td></tr>
            ) : words.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-text-secondary">Kelime bulunamadı.</td></tr>
            ) : words.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0 hover:bg-bg-secondary transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-text-primary">{w.word}</td>
                <td className="px-4 py-3 text-text-secondary max-w-xs">
                  <span className="truncate block">{w.meaning}</span>
                  {w.context && (
                    <span className="text-xs text-tile-filled/70 italic truncate block max-w-xs" title={w.context}>
                      "{w.context}"
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-bg-primary border border-border text-text-secondary text-xs">
                    {w.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${w.is_active ? 'bg-green-500/10 text-green-400' : 'bg-tile-absent/10 text-tile-absent'}`}>
                    {w.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => startEdit(w)}
                      className="p-1.5 rounded-lg hover:bg-bg-primary text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                      title="Düzenle"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => void handleToggle(w)}
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${w.is_active ? 'hover:bg-tile-absent/10 text-tile-absent' : 'hover:bg-green-500/10 text-green-400'}`}
                      title={w.is_active ? 'Deaktive Et' : 'Aktive Et'}
                    >
                      {w.is_active ? <X size={14} /> : <Check size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{total} kelime</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded cursor-pointer disabled:opacity-30 hover:text-text-primary"
          >
            <ChevronLeft size={16} />
          </button>
          <span>{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 rounded cursor-pointer disabled:opacity-30 hover:text-text-primary"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
