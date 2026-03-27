import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCreateList, useAddWords } from '../hooks/useUserLists';
import type { AddWordsResult } from '@harfhane/shared';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (slug: string) => void;
}

const WORD_LENGTHS = [4, 5, 6] as const;

function parseWordsInput(raw: string): Array<{ word: string; meaning?: string }> {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const sep = line.indexOf(':');
      if (sep !== -1) {
        return { word: line.slice(0, sep).trim(), meaning: line.slice(sep + 1).trim() || undefined };
      }
      return { word: line };
    });
}

export default function CreateListModal({ isOpen, onClose, onCreated }: CreateListModalProps): React.JSX.Element | null {
  const { token } = useAuth();
  const createList = useCreateList(token);
  const addWords = useAddWords(token);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [wordLength, setWordLength] = useState<4 | 5 | 6>(5);
  const [isPublic, setIsPublic] = useState(false);
  const [slug, setSlug] = useState('');
  const [wordsRaw, setWordsRaw] = useState('');
  const [step, setStep] = useState<'info' | 'words'>('info');
  const [createdSlug, setCreatedSlug] = useState('');
  const [addResult, setAddResult] = useState<AddWordsResult | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateList = async () => {
    setError('');
    try {
      const res = await createList.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        wordLength,
        isPublic,
        slug: slug.trim() || undefined,
      });
      setCreatedSlug(res.list.slug);
      setStep('words');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu');
    }
  };

  const handleAddWords = async () => {
    setError('');
    const words = parseWordsInput(wordsRaw);
    if (words.length === 0) {
      onCreated(createdSlug);
      handleClose();
      return;
    }
    try {
      const result = await addWords.mutateAsync({ slug: createdSlug, input: { words } });
      setAddResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kelimeler eklenirken hata oluştu');
    }
  };

  const handleClose = () => {
    setName(''); setDescription(''); setSlug(''); setWordsRaw('');
    setWordLength(5); setIsPublic(false); setStep('info');
    setCreatedSlug(''); setAddResult(null); setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-text-primary text-lg">
            {step === 'info' ? 'Yeni Liste' : 'Kelime Ekle'}
          </h2>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === 'info' && (
            <>
              <div>
                <label className="block text-text-secondary text-sm mb-1">Liste adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Örn: Osmanlıca Kelimeler"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg-secondary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-correct text-sm"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Açıklama (opsiyonel)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Liste hakkında kısa bir açıklama..."
                  maxLength={500}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg-secondary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-correct text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-2">Kelime uzunluğu</label>
                <div className="flex gap-2">
                  {WORD_LENGTHS.map(len => (
                    <button
                      key={len}
                      onClick={() => setWordLength(len)}
                      className={`flex-1 h-10 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                        wordLength === len
                          ? 'bg-correct text-white'
                          : 'bg-tile-empty text-text-primary hover:bg-tile-filled'
                      }`}
                    >
                      {len} harf
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Liste kodu (opsiyonel)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="otomatik oluşturulur"
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-bg-secondary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-correct text-sm font-mono"
                />
                <p className="text-text-secondary/60 text-xs mt-1">harfhane.app/play/{slug || '<otomatik>'}</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsPublic(p => !p)}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${isPublic ? 'bg-correct' : 'bg-tile-filled'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-text-primary text-sm">Herkese açık (listeler sayfasında görünsün)</span>
              </label>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={() => void handleCreateList()}
                disabled={!name.trim() || createList.isPending}
                className="w-full py-3 rounded-xl bg-correct text-white font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {createList.isPending ? 'Oluşturuluyor...' : 'Listeyi oluştur'}
              </button>
            </>
          )}

          {step === 'words' && !addResult && (
            <>
              <p className="text-text-secondary text-sm">
                Liste oluşturuldu: <span className="text-correct font-mono">{createdSlug}</span>
              </p>
              <p className="text-text-secondary text-sm">
                {wordLength} harfli kelimeleri ekle. Her satıra bir kelime. Anlam eklemek için <code className="text-xs bg-tile-empty px-1 rounded">kelime: anlam</code> formatını kullan.
              </p>
              <textarea
                value={wordsRaw}
                onChange={e => setWordsRaw(e.target.value)}
                placeholder={`masa\nsandalye: oturma mobilyası\nkitap`}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-border bg-bg-secondary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-correct text-sm font-mono resize-none"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { onCreated(createdSlug); handleClose(); }}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-medium cursor-pointer hover:bg-tile-empty transition-colors text-sm"
                >
                  Kelimesiz bitir
                </button>
                <button
                  onClick={() => void handleAddWords()}
                  disabled={addWords.isPending}
                  className="flex-1 py-3 rounded-xl bg-correct text-white font-semibold cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  {addWords.isPending ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </>
          )}

          {addResult && (
            <>
              <div className="rounded-xl bg-bg-secondary p-4 space-y-1">
                <p className="text-text-primary font-semibold">{addResult.added} kelime eklendi</p>
                {addResult.skipped > 0 && (
                  <p className="text-text-secondary text-sm">{addResult.skipped} kelime atlandı</p>
                )}
                {addResult.errors.length > 0 && (
                  <ul className="text-red-500 text-xs space-y-0.5 mt-2">
                    {addResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
              <button
                onClick={() => { onCreated(createdSlug); handleClose(); }}
                className="w-full py-3 rounded-xl bg-correct text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Listeye git
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
