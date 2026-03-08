import { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (secret: string) => void;
  error?: string;
}

export default function AdminLogin({ onLogin, error }: AdminLoginProps): React.JSX.Element {
  const [secret, setSecret] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (secret.trim()) onLogin(secret.trim());
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-bg-secondary rounded-xl border border-border">
        <div className="flex items-center gap-3 mb-6">
          <Lock size={20} className="text-tile-filled" />
          <h1 className="text-lg font-bold text-text-primary">Admin Girişi</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Gizli anahtar"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-secondary focus:outline-none focus:border-tile-filled"
          />
          {error && <p className="text-sm text-tile-absent">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-tile-filled text-white font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
