import { useState } from "react";
import { ArrowRight, ArrowLeft, Search, Plus, Heart, MessageCircle } from "lucide-react";
import { usePublicLists } from "../hooks/useWordApi";
import { useAuth } from "../context/AuthContext";
import CreateListModal from "./CreateListModal";
import type { WordList } from "@nurdle/shared";

interface ListsPageProps {
  onGoHome: () => void;
  onAuthRequired?: () => void;
}

export default function ListsPage({ onGoHome, onAuthRequired }: ListsPageProps): React.JSX.Element {
  const { data: listsData, isLoading } = usePublicLists();
  const { token } = useAuth();
  const [slugInput, setSlugInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const lists = listsData?.lists ?? [];

  const handleSlugGo = () => {
    const slug = slugInput.trim().toLowerCase();
    if (slug) window.location.href = `/play/${slug}`;
  };

  const handleCreateClick = () => {
    if (!token) { onAuthRequired?.(); return; }
    setShowCreate(true);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onGoHome}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Ana sayfaya dön"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-text-primary tracking-wide">Listeler</h1>
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-correct text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Yeni liste
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        {/* Liste kodu girişi */}
        <div>
          <p className="text-text-secondary text-sm mb-2">Liste koduyla doğrudan oyna</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="liste-kodu"
              value={slugInput}
              onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              onKeyDown={e => { if (e.key === "Enter") handleSlugGo(); }}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-bg-secondary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-correct text-sm"
            />
            <button
              onClick={handleSlugGo}
              disabled={!slugInput.trim()}
              className="px-4 py-3 rounded-xl bg-correct text-white font-medium cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Herkese açık listeler */}
        <div>
          <p className="text-text-secondary text-sm mb-3">Herkese açık listeler</p>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-bg-secondary animate-pulse" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">Henüz herkese açık liste yok.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lists.map(list => (
                <div
                  key={list.slug}
                  className="w-full bg-bg-secondary border border-border rounded-xl px-5 py-4"
                >
                  <button
                    onClick={() => { window.location.href = `/play/${list.slug}`; }}
                    className="w-full text-left flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{list.name}</p>
                      {list.description && (
                        <p className="text-text-secondary text-xs mt-0.5 truncate">{list.description}</p>
                      )}
                      <p className="text-text-secondary text-xs mt-1">
                        {list.wordLength} harf · {list.wordCount} kelime
                        {list.hasDaily && <span className="ml-2 text-correct font-medium">Günlük</span>}
                      </p>
                    </div>
                    <ArrowRight size={18} className="text-text-secondary flex-shrink-0 ml-3" />
                  </button>

                  {/* Social row */}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                    <SocialCounts list={list} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CreateListModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(slug) => { window.location.href = `/play/${slug}`; }}
      />
    </div>
  );
}

function SocialCounts({ list }: { list: WordList }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 text-text-secondary">
      <span className="flex items-center gap-1 text-xs">
        <Heart size={12} />
        <span>{list.likeCount ?? 0}</span>
      </span>
      <span className="flex items-center gap-1 text-xs">
        <MessageCircle size={12} />
        <span>{list.commentCount ?? 0}</span>
      </span>
    </div>
  );
}
