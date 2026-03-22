import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronRight, ChevronLeft, Globe, Lock, Copy, Check, Pencil } from 'lucide-react';
import {
  listWordLists,
  createWordList,
  updateWordList,
  deleteWordList,
  getListWords,
  addWordToList,
  removeWordFromList,
  listWords,
  type AdminWordList,
  type AdminWord,
} from '../../lib/admin-api';

interface ListsManagerProps {
  secret: string;
}

interface CreateFormState {
  slug: string;
  name: string;
  description: string;
  word_length: number;
  is_public: boolean;
}

const EMPTY_FORM: CreateFormState = {
  slug: '', name: '', description: '', word_length: 5, is_public: false,
};


export default function ListsManager({ secret }: ListsManagerProps): React.JSX.Element {
  const [lists, setLists] = useState<AdminWordList[]>([]);
  const [selectedList, setSelectedList] = useState<AdminWordList | null>(null);
  const [listWords2, setListWords2] = useState<AdminWord[]>([]);
  const [allWords, setAllWords] = useState<AdminWord[]>([]);
  const [wordSearch, setWordSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingList, setEditingList] = useState<AdminWordList | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', is_public: false });
  const [editSaving, setEditSaving] = useState(false);

  const loadLists = useCallback(async () => {
    try {
      const res = await listWordLists(secret);
      setLists(res.lists);
    } catch {
      setError('Listeler yüklenemedi.');
    }
  }, [secret]);

  useEffect(() => { void loadLists(); }, [loadLists]);

  const handleSelectList = async (list: AdminWordList) => {
    setSelectedList(list);
    setWordSearch('');
    try {
      const [wordsRes, allWordsRes] = await Promise.all([
        getListWords(secret, list.slug),
        listWords(secret, { limit: 200, active: '1', ...(list.wordLength ? {} : {}) }),
      ]);
      setListWords2(wordsRes.words);
      setAllWords(allWordsRes.words);
    } catch {
      setError('Kelimeler yüklenemedi.');
    }
  };

  const handleCreate = async () => {
    if (!form.slug || !form.name) return;
    setLoading(true);
    setError('');
    try {
      await createWordList(secret, {
        slug: form.slug,
        name: form.name,
        description: form.description || undefined,
        word_length: form.word_length,
        is_public: form.is_public,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadLists();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`"${slug}" listesini silmek istediğinden emin misin?`)) return;
    try {
      await deleteWordList(secret, slug);
      if (selectedList?.slug === slug) setSelectedList(null);
      await loadLists();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleAddWord = async (wordId: number) => {
    if (!selectedList) return;
    try {
      await addWordToList(secret, selectedList.slug, wordId);
      const res = await getListWords(secret, selectedList.slug);
      setListWords2(res.words);
      await loadLists();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRemoveWord = async (wordId: number) => {
    if (!selectedList) return;
    try {
      await removeWordFromList(secret, selectedList.slug, wordId);
      setListWords2(prev => prev.filter(w => w.id !== wordId));
      await loadLists();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const startEdit = (list: AdminWordList, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingList(list);
    setEditForm({ name: list.name, description: list.description ?? '', is_public: list.isPublic });
    setError('');
  };

  const handleEditSave = async () => {
    if (!editingList) return;
    setEditSaving(true);
    setError('');
    try {
      const updated = await updateWordList(secret, editingList.slug, {
        name: editForm.name,
        description: editForm.description || null,
        is_public: editForm.is_public,
      });
      setLists(prev => prev.map(l => l.slug === updated.slug ? updated : l));
      if (selectedList?.slug === updated.slug) setSelectedList(updated);
      setEditingList(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEditSaving(false);
    }
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/play/${slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const listWordIds = new Set(listWords2.map(w => w.id));
  const filteredAllWords = allWords.filter(w =>
    !listWordIds.has(w.id) &&
    (w.word.includes(wordSearch.toUpperCase()) || w.meaning.toLowerCase().includes(wordSearch.toLowerCase()))
  );

  return (
    <div className="flex gap-4 h-full">
      {/* Sol: Liste listesi */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">{lists.length} liste</span>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-tile-correct text-white cursor-pointer hover:opacity-90"
          >
            <Plus size={12} /> Yeni liste
          </button>
        </div>

        {showForm && (
          <div className="border border-border rounded-lg p-3 flex flex-col gap-2 bg-bg-secondary text-sm">
            <input
              placeholder="slug (örn: risale-temel)"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
              className="w-full px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary focus:outline-none"
            />
            <input
              placeholder="Liste adı"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary focus:outline-none"
            />
            <input
              placeholder="Açıklama (opsiyonel)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={form.word_length}
                onChange={e => setForm(f => ({ ...f, word_length: Number(e.target.value) }))}
                className="flex-1 px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary cursor-pointer focus:outline-none"
              >
                {[4, 5, 6].map(l => <option key={l} value={l}>{l} harf</option>)}
              </select>
              <label className="flex items-center gap-1 cursor-pointer text-text-secondary">
                <input
                  type="checkbox"
                  checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                  className="cursor-pointer"
                />
                Herkese açık
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void handleCreate()}
                disabled={loading || !form.slug || !form.name}
                className="flex-1 py-1.5 rounded bg-tile-correct text-white text-xs font-medium cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Oluştur'}
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="flex-1 py-1.5 rounded border border-border text-text-secondary text-xs cursor-pointer hover:bg-bg-secondary"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex flex-col gap-1 overflow-y-auto">
          {lists.map(list => (
            <div key={list.id}>
              {editingList?.slug === list.slug ? (
                <div className="border border-tile-correct rounded-lg p-3 flex flex-col gap-2 bg-bg-secondary text-sm">
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Liste adı"
                    className="w-full px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary focus:outline-none"
                  />
                  <input
                    value={editForm.description}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Açıklama (opsiyonel)"
                    className="w-full px-2 py-1.5 rounded border border-border bg-bg-primary text-text-primary focus:outline-none"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary text-xs">
                    <input
                      type="checkbox"
                      checked={editForm.is_public}
                      onChange={e => setEditForm(f => ({ ...f, is_public: e.target.checked }))}
                      className="cursor-pointer"
                    />
                    Herkese açık
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleEditSave()}
                      disabled={editSaving || !editForm.name}
                      className="flex-1 py-1.5 rounded bg-tile-correct text-white text-xs font-medium cursor-pointer hover:opacity-90 disabled:opacity-50"
                    >
                      {editSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                      onClick={() => setEditingList(null)}
                      className="flex-1 py-1.5 rounded border border-border text-text-secondary text-xs cursor-pointer hover:bg-bg-primary"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => void handleSelectList(list)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedList?.slug === list.slug
                      ? 'bg-tile-correct/20 border border-tile-correct'
                      : 'bg-bg-secondary hover:bg-bg-secondary/80 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {list.isPublic ? <Globe size={11} className="text-tile-correct flex-shrink-0" /> : <Lock size={11} className="text-text-secondary flex-shrink-0" />}
                      <span className="text-sm font-medium text-text-primary truncate">{list.name}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">{list.slug} · {list.wordCount} kelime · {list.wordLength} harf</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={e => startEdit(list, e)}
                      className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
                      title="Düzenle"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); copyUrl(list.slug); }}
                      className="p-1 rounded text-text-secondary hover:text-text-primary cursor-pointer"
                      title="URL kopyala"
                    >
                      {copied ? <Check size={13} className="text-tile-correct" /> : <Copy size={13} />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); void handleDelete(list.slug); }}
                      className="p-1 rounded text-text-secondary hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={13} className="text-text-secondary" />
                  </div>
                </div>
              )}
            </div>
          ))}
          {lists.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-8">Henüz liste yok.</p>
          )}
        </div>
      </div>

      {/* Sağ: Seçilen listedeki kelimeler + ekleme */}
      {selectedList ? (
        <div className="flex-1 flex gap-3 min-w-0">
          {/* Listedeki kelimeler */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedList(null)} className="text-text-secondary hover:text-text-primary cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <h3 className="font-medium text-text-primary text-sm">{selectedList.name}</h3>
              <span className="text-xs text-text-secondary">({listWords2.length} kelime)</span>
            </div>
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[500px]">
              {listWords2.map(w => (
                <div key={w.id} className="flex items-center justify-between px-3 py-2 bg-bg-secondary rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-text-primary">{w.word}</span>
                    <span className="text-xs text-text-secondary ml-2">{w.meaning.slice(0, 50)}{w.meaning.length > 50 ? '...' : ''}</span>
                  </div>
                  <button
                    onClick={() => void handleRemoveWord(w.id)}
                    className="p-1 text-text-secondary hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {listWords2.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-8">Liste boş. Sağdan kelime ekle.</p>
              )}
            </div>
          </div>

          {/* Kelime ekleme */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-2">
            <h4 className="text-sm font-medium text-text-primary">Kelime ekle</h4>
            <input
              placeholder="Ara..."
              value={wordSearch}
              onChange={e => setWordSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded border border-border bg-bg-primary text-text-primary focus:outline-none"
            />
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[460px]">
              {filteredAllWords.slice(0, 50).map(w => (
                <div key={w.id} className="flex items-center justify-between px-2 py-1.5 bg-bg-secondary rounded hover:bg-bg-secondary/80">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-text-primary">{w.word}</span>
                    <span className="text-xs text-text-secondary ml-1">{w.meaning.slice(0, 30)}{w.meaning.length > 30 ? '...' : ''}</span>
                  </div>
                  <button
                    onClick={() => void handleAddWord(w.id)}
                    className="ml-2 flex-shrink-0 p-0.5 rounded text-tile-correct hover:bg-tile-correct/20 cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
              {filteredAllWords.length === 0 && (
                <p className="text-xs text-text-secondary text-center py-4">Eklenecek kelime yok.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
          Bir liste seç.
        </div>
      )}
    </div>
  );
}
