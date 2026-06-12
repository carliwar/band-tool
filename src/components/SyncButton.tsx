import { useEffect, useRef, useState } from 'react';
import {
  startAutoSync,
  hasBuildPat,
  getEffectivePat,
  LS_GIST_ID_KEY,
  type SyncStatus,
} from '../db/cloudSync';

function formatTs(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Compact sync button for use outside Settings. No gist ID shown. */
export function SyncButton() {
  const [gistId, setGistId] = useState<string | null>(() => localStorage.getItem(LS_GIST_ID_KEY));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle' });
  const syncRef = useRef<{ cleanup: () => void; push: () => void } | null>(null);

  useEffect(() => {
    if (!hasBuildPat) return;
    syncRef.current?.cleanup();
    syncRef.current = startAutoSync(
      getEffectivePat(''),
      gistId,
      (id) => {
        setGistId(id);
        localStorage.setItem(LS_GIST_ID_KEY, id);
      },
      setSyncStatus,
    );
    return () => {
      syncRef.current?.cleanup();
      syncRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasBuildPat) return null;

  let statusLabel = '';
  let statusColor = 'var(--bone-dim)';
  if (syncStatus.state === 'pushing') { statusLabel = '↑'; statusColor = 'var(--gold)'; }
  else if (syncStatus.state === 'pulling') { statusLabel = '↓'; statusColor = 'var(--gold)'; }
  else if (syncStatus.state === 'synced') { statusLabel = `● ${formatTs(syncStatus.at)}`; statusColor = 'var(--toxic)'; }
  else if (syncStatus.state === 'error') { statusLabel = '⚠'; statusColor = 'var(--blood-bright)'; }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
      <button
        className="ghost small"
        onClick={() => syncRef.current?.push()}
        disabled={syncStatus.state === 'pushing' || syncStatus.state === 'pulling'}
        aria-label="Sincronizar ahora"
        title="Sincronizar ahora"
      >
        ↑↓
      </button>
      {statusLabel && (
        <span style={{ color: statusColor, fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)' }}>
          {statusLabel}
        </span>
      )}
    </span>
  );
}
