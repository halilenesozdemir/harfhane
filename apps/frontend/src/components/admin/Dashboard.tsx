import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, Users, Gamepad2, AlertTriangle, CheckCircle } from 'lucide-react';
import { getAdminStats, getScheduleHealth, type AdminStats, type ScheduleHealthEntry } from '../../lib/admin-api';

interface DashboardProps {
  secret: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: 'green' | 'yellow' | 'red' | 'blue';
}

function StatCard({ label, value, sub, icon, accent = 'blue' }: StatCardProps): React.JSX.Element {
  const accentClasses: Record<string, string> = {
    green: 'bg-correct/10 text-correct',
    yellow: 'bg-present/10 text-present',
    red: 'bg-absent/10 text-absent',
    blue: 'bg-tile-empty text-text-secondary',
  };

  return (
    <div className="bg-bg-secondary border border-border-color rounded-xl p-4 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accentClasses[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
        {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function severityLabel(severity: ScheduleHealthEntry['severity']): string {
  if (severity === 'critical') return 'Kritik';
  if (severity === 'warning') return 'Uyarı';
  return 'İyi';
}

function severityClasses(severity: ScheduleHealthEntry['severity']): string {
  if (severity === 'critical') return 'bg-absent/10 text-absent';
  if (severity === 'warning') return 'bg-present/10 text-present';
  return 'bg-correct/10 text-correct';
}

function ScheduleHealthCard({ entry }: { entry: ScheduleHealthEntry }): React.JSX.Element {
  return (
    <div className="bg-bg-secondary border border-border-color rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{entry.length} harf</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityClasses(entry.severity)}`}>
          {severityLabel(entry.severity)}
        </span>
      </div>
      <p className="text-2xl font-bold text-text-primary tabular-nums">{entry.runwayDays} gün</p>
      <p className="text-xs text-text-secondary">
        Son tarih: {entry.lastScheduledDate ?? 'yok'} · Boşta stok: {entry.unscheduledStock}
      </p>
    </div>
  );
}

export default function Dashboard({ secret }: DashboardProps): React.JSX.Element {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [scheduleHealth, setScheduleHealth] = useState<ScheduleHealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([getAdminStats(secret), getScheduleHealth(secret)])
      .then(([statsResult, healthResult]) => {
        setStats(statsResult);
        setScheduleHealth(healthResult);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Yüklenemedi'))
      .finally(() => setLoading(false));
  }, [secret]);

  if (loading) {
    return <p className="text-text-secondary text-sm py-8 text-center">Yükleniyor...</p>;
  }

  if (error || !stats) {
    return <p className="text-absent text-sm py-8 text-center">{error || 'Veri alınamadı'}</p>;
  }

  const coverageOk = stats.daily.unscheduledNext30 === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Toplam Kelime"
          value={stats.words.total}
          sub={`${stats.words.active} aktif · ${stats.words.inactive} pasif`}
          icon={<BookOpen size={18} />}
          accent="blue"
        />
        <StatCard
          label="Bugünün Kelimesi"
          value={stats.daily.today ?? '—'}
          sub={stats.daily.today ? 'Programlanmış' : 'Programlanmamış!'}
          icon={<CalendarDays size={18} />}
          accent={stats.daily.today ? 'green' : 'red'}
        />
        <StatCard
          label="Kayıtlı Kullanıcı"
          value={stats.users.total}
          icon={<Users size={18} />}
          accent="blue"
        />
        <StatCard
          label="Bugün Oynanan"
          value={stats.games.playedToday}
          sub={`Toplam: ${stats.games.totalPlayed}`}
          icon={<Gamepad2 size={18} />}
          accent="blue"
        />
      </div>

      <div className="bg-bg-secondary border border-border-color rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">Günlük Program Kapsamı (Önümüzdeki 30 gün)</h3>
          {coverageOk ? (
            <div className="flex items-center gap-1.5 text-xs text-correct">
              <CheckCircle size={14} /> Tam
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-present">
              <AlertTriangle size={14} /> {stats.daily.unscheduledNext30} gün eksik
            </div>
          )}
        </div>
        <div className="w-full bg-tile-empty rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${coverageOk ? 'bg-correct' : 'bg-present'}`}
            style={{ width: `${(stats.daily.scheduledNext30 / 30) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <span>{stats.daily.scheduledNext30} / 30 gün programlanmış</span>
          {!coverageOk && (
            <span className="text-present font-medium">
              Eksik günleri programlamayı unutma!
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-primary">Takvim Sağlığı (Uzunluk Başına Runway)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {scheduleHealth.map((entry) => (
            <ScheduleHealthCard key={entry.length} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}
