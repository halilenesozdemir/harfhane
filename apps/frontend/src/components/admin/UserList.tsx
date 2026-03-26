import { useState, useEffect } from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { getAdminUsers, type AdminUserRow } from '../../lib/admin-api';

interface UserListProps {
  secret: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function calculateWinRate(played: number, won: number): string {
  if (played === 0) return '0';
  return Math.round((won / played) * 100).toString();
}

export default function UserList({ secret }: UserListProps): React.JSX.Element {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setError('');
    getAdminUsers(secret)
      .then(setUsers)
      .catch(() => setError('Kullanıcılar yüklenemedi.'))
      .finally(() => setIsLoading(false));
  }, [secret]);

  if (isLoading) {
    return <p className="text-center text-text-secondary py-8 text-sm animate-pulse">Yükleniyor...</p>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-tile-absent text-sm">
        <AlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <Users size={32} className="mb-2 opacity-50" />
        <p className="text-sm">Henüz kullanıcı yok.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-text-secondary">
            <th className="py-2 px-3 font-medium">ID</th>
            <th className="py-2 px-3 font-medium">Kullanıcı Adı</th>
            <th className="py-2 px-3 font-medium">E-posta</th>
            <th className="py-2 px-3 font-medium text-center">Oyun</th>
            <th className="py-2 px-3 font-medium text-center">Kazanma %</th>
            <th className="py-2 px-3 font-medium">Son Oyun</th>
            <th className="py-2 px-3 font-medium">Kayıt</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border/50 hover:bg-bg-secondary transition-colors">
              <td className="py-2.5 px-3 tabular-nums text-text-secondary">{user.id}</td>
              <td className="py-2.5 px-3 font-semibold text-text-primary">{user.username}</td>
              <td className="py-2.5 px-3 text-text-secondary">{user.email}</td>
              <td className="py-2.5 px-3 text-center tabular-nums text-text-primary">{user.total_played}</td>
              <td className="py-2.5 px-3 text-center tabular-nums text-text-primary">
                {calculateWinRate(user.total_played, user.total_won)}%
              </td>
              <td className="py-2.5 px-3 text-text-secondary">
                {user.last_played ? formatDate(user.last_played) : '-'}
              </td>
              <td className="py-2.5 px-3 text-text-secondary">{formatDate(user.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
