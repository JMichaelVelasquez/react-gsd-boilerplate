import type { SyncStatus } from '../hooks/useSupabaseSync';

const STATUS_CONFIG: Record<SyncStatus, { color: string; pulse: boolean; label: string; emoji: string }> = {
  synced: { color: 'bg-green-400', pulse: false, label: 'Synced', emoji: '☁️' },
  syncing: { color: 'bg-yellow-400', pulse: true, label: 'Syncing...', emoji: '🔄' },
  offline: { color: 'bg-gray-400', pulse: false, label: 'Offline', emoji: '📴' },
  error: { color: 'bg-red-400', pulse: false, label: 'Sync error', emoji: '⚠️' },
};

interface Props {
  status: SyncStatus;
}

export default function SyncIndicator({ status }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5
        bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-medium
        shadow-lg border border-white/10 select-none transition-all duration-300"
      title={config.label}
    >
      <span className="text-sm">{config.emoji}</span>
      <span
        className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      <span className="opacity-80">{config.label}</span>
    </div>
  );
}
