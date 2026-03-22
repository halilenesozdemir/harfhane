import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useListComments, useAddComment, useDeleteComment } from '../hooks/useSocial';

interface CommentSectionProps {
  slug: string;
  onLoginRequired?: () => void;
}

export default function CommentSection({ slug, onLoginRequired }: CommentSectionProps): React.JSX.Element {
  const { token, user } = useAuth();
  const { data, isLoading } = useListComments(slug);
  const addComment = useAddComment(token);
  const deleteComment = useDeleteComment(token);

  const [content, setContent] = useState('');

  const comments = data?.comments ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { onLoginRequired?.(); return; }
    const trimmed = content.trim();
    if (!trimmed) return;
    await addComment.mutateAsync({ slug, content: trimmed });
    setContent('');
  };

  const handleDelete = (commentId: number) => {
    deleteComment.mutate({ slug, commentId });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-text-primary text-sm">
        Yorumlar {comments.length > 0 && <span className="text-text-secondary font-normal">({comments.length})</span>}
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-10 rounded-lg bg-bg-secondary animate-pulse" />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-text-secondary text-sm">Henüz yorum yok. İlk yorumu sen yaz!</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex-1 bg-bg-secondary rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-text-primary text-xs font-semibold">{comment.username}</span>
                  <span className="text-text-secondary/50 text-xs">
                    {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="text-text-primary text-sm">{comment.content}</p>
              </div>
              {user?.username === comment.username && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleteComment.isPending}
                  className="text-text-secondary hover:text-red-400 transition-colors cursor-pointer self-start mt-2 disabled:opacity-50"
                  aria-label="Yorumu sil"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={e => void handleSubmit(e)} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={token ? 'Yorum yaz...' : 'Yorum yazmak için giriş yap'}
          maxLength={1000}
          onClick={() => { if (!token) onLoginRequired?.(); }}
          readOnly={!token}
          className="flex-1 px-4 py-2 rounded-xl border border-border bg-bg-secondary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-correct text-sm"
        />
        <button
          type="submit"
          disabled={!content.trim() || addComment.isPending}
          className="px-3 py-2 rounded-xl bg-correct text-white cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
