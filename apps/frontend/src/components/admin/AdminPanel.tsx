import { useState } from 'react';
import { LayoutList, CalendarDays, Upload, LogOut, ListTree } from 'lucide-react';
import WordsManager from './WordsManager';
import DailyScheduler from './DailyScheduler';
import ImportWords from './ImportWords';
import ListsManager from './ListsManager';

interface AdminPanelProps {
  secret: string;
  onLogout: () => void;
}

type Tab = 'words' | 'daily' | 'import' | 'lists';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'words', label: 'Kelimeler', icon: <LayoutList size={16} /> },
  { id: 'daily', label: 'Günlük Program', icon: <CalendarDays size={16} /> },
  { id: 'import', label: 'İçe Aktar', icon: <Upload size={16} /> },
  { id: 'lists', label: 'Listeler', icon: <ListTree size={16} /> },
];

export default function AdminPanel({ secret, onLogout }: AdminPanelProps): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('words');

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-text-primary tracking-widest text-sm">NURDLE ADMIN</h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
          >
            <LogOut size={16} /> Çıkış
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors border-b-2 -mb-px ${
                tab === id
                  ? 'border-tile-filled text-tile-filled'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'words' && <WordsManager secret={secret} />}
        {tab === 'daily' && <DailyScheduler secret={secret} />}
        {tab === 'import' && <ImportWords secret={secret} />}
        {tab === 'lists' && <ListsManager secret={secret} />}
      </div>
    </div>
  );
}
