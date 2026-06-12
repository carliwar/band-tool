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

function StatusBadge({ status }: { status: SyncStatus }) {
  if (status.state === 'idle') return null;
  let label = '';
  let color = 'var(--bone-dim)';
  if (status.state === 'pushing') { label = '↑ Guardando…'; color = 'var(--gold)'; }
  else if (status.state === 'pulling') { label = '↓ Actualizando…'; color = 'var(--gold)'; }
  else if (status.state === 'synced') { label = `● Sincronizado ${formatTs(status.at)}`; color = 'var(--toxic)'; }
  else if (status.state === 'error') { label = `⚠ ${status.message}`; color = 'var(--blood-bright)'; }
  return (
    <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)' }}>
      {label}
    </span>
  );
}

export function CloudSyncPanel() {
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

  return (
    <section
      style={{
        marginTop: 'var(--sp-6)',
        paddingTop: 'var(--sp-5)',
        borderTop: '1px solid var(--char)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h2)',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          Sync
        </span>
        <button
          className="ghost small"
          onClick={() => syncRef.current?.push()}
          disabled={syncStatus.state === 'pushing' || syncStatus.state === 'pulling'}
          aria-label="Sincronizar ahora"
          title="Sincronizar ahora"
        >
          ↑↓
        </button>
        <StatusBadge status={syncStatus} />
      </div>
    </section>
  );
}