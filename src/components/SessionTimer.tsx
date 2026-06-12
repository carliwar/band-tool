import { useEffect, useState } from 'react';
import { getTotalElapsed, getActiveSession } from '../db/repository';
import { useDbVersion } from '../state/store';

interface Props {
  songId: number;
}

function formatHM(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function SessionTimer({ songId }: Props) {
  const dbV = useDbVersion();
  const [tick, setTick] = useState(0);
  const active = getActiveSession(songId);

  useEffect(() => {
    if (!active) return;
    const i = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, [active?.id]);

  const total = getTotalElapsed(songId, Date.now() + tick * 0);
  void dbV;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <span
        className="mono"
        style={{
          fontSize: 'var(--fs-small)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--bone-dim)',
        }}
      >
        {active ? 'Sesión activa' : 'Sin sesión activa'}
      </span>
      <span
        className="mono"
        style={{
          fontSize: '1.5rem',
          color: active ? 'var(--blood-bright)' : 'var(--bone)',
          fontWeight: 700,
          textShadow: active ? '0 0 8px rgba(232, 58, 46, 0.3)' : 'none',
        }}
      >
        {formatHM(total)}
      </span>
    </div>
  );
}
