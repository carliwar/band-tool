import { useEffect, useRef, useState } from 'react';
import {
  validatePat,
  startAutoSync,
  clearSyncStorage,
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

const LS_PAT = 'band-tool-gist-pat';


export function CloudSyncPanel() {
  const [pat, setPat] = useState(() => localStorage.getItem(LS_PAT) ?? '');
  const [gistId, setGistId] = useState<string | null>(() => localStorage.getItem(LS_GIST_ID_KEY));
  const [patInput, setPatInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle' });

  const cleanupRef = useRef<(() => void) | null>(null);

  const isConnected = hasBuildPat || !!pat;
  const effectivePat = getEffectivePat(pat);

  useEffect(() => {
    if (!isConnected) return;
    cleanupRef.current?.();
    cleanupRef.current = startAutoSync(
      effectivePat,
      gistId,
      (id) => {
        setGistId(id);
        localStorage.setItem(LS_GIST_ID_KEY, id);
      },
      setSyncStatus,
    );
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
    // effectivePat and gistId are intentionally only read on mount/reconnect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, effectivePat]);

  async function handleConnect() {
    const trimmed = patInput.trim();
    if (!trimmed) return;
    setConnecting(true);
    setConnectError(null);
    try {
      const valid = await validatePat(trimmed);
      if (!valid) { setConnectError('Token inválido o sin permiso de Gist.'); return; }
      localStorage.setItem(LS_PAT, trimmed);
      setPat(trimmed);
      setPatInput('');
    } catch {
      setConnectError('No se pudo conectar. Verificá tu conexión a internet.');
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    cleanupRef.current?.();
    cleanupRef.current = null;
    localStorage.removeItem(LS_PAT);
    clearSyncStorage();
    setPat('');
    setGistId(null);
    setSyncStatus({ state: 'idle' });
  }

  return (
    <section
      style={{
        marginTop: 'var(--sp-6)',
        paddingTop: 'var(--sp-5)',
        borderTop: '1px solid var(--char)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h2)',
          marginBottom: 'var(--sp-3)',
        }}
      >
        Sync en la nube
      </h3>

      {!isConnected ? (
        <>
          <p className="dim" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-small)' }}>
            Necesitás un{' '}
            <a
              href="https://github.com/settings/tokens/new?scopes=gist&description=band-tool"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub PAT con scope <code>gist</code>
            </a>
            . Se guarda solo en este navegador.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 260px' }}>
              <label htmlFor="gist-pat-input">Token de acceso personal</label>
              <input
                id="gist-pat-input"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                value={patInput}
                onChange={(e) => setPatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleConnect(); }}
                autoComplete="off"
                disabled={connecting}
              />
            </div>
            <button onClick={() => void handleConnect()} disabled={connecting || !patInput.trim()}>
              {connecting ? 'Verificando…' : 'Conectar'}
            </button>
          </div>
          {connectError && (
            <p style={{ marginTop: 'var(--sp-3)', color: 'var(--blood-bright)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)' }}>
              {connectError}
            </p>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span style={{ color: 'var(--toxic)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)' }}>
                {hasBuildPat ? '● Configurado' : '● Conectado'}
              </span>
              {gistId && (
                <span className="mono dim" style={{ fontSize: 'var(--fs-small)' }}>
                  gist:{gistId.slice(0, 8)}…
                </span>
              )}
            </div>
            <StatusBadge status={syncStatus} />
          </div>
          {!hasBuildPat && (
            <button className="ghost small" onClick={handleDisconnect}>
              Desconectar
            </button>
          )}
        </div>
      )}
    </section>
  );
}



