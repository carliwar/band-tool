import { useState } from 'react';
import { Modal } from './Modal';
import { validatePat, pushToGist, pullFromGist } from '../db/cloudSync';

const LS_PAT = 'band-tool-gist-pat';
const LS_GIST_ID = 'band-tool-gist-id';
const LS_LAST_SYNC = 'band-tool-gist-last-sync';

function formatSync(ts: string | null): string {
  if (!ts) return 'Nunca';
  const d = new Date(Number(ts));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CloudSyncPanel() {
  const [pat, setPat] = useState(() => localStorage.getItem(LS_PAT) ?? '');
  const [gistId, setGistId] = useState<string | null>(() => localStorage.getItem(LS_GIST_ID));
  const [lastSync, setLastSync] = useState<string | null>(() => localStorage.getItem(LS_LAST_SYNC));
  const [patInput, setPatInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmPull, setConfirmPull] = useState(false);

  const isConnected = !!pat;

  function clearMessages() {
    setError(null);
    setInfo(null);
  }

  async function handleConnect() {
    clearMessages();
    const trimmed = patInput.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const valid = await validatePat(trimmed);
      if (!valid) {
        setError('Token inválido o sin permiso de Gist.');
        return;
      }
      localStorage.setItem(LS_PAT, trimmed);
      setPat(trimmed);
      setPatInput('');
      setInfo('Conectado correctamente.');
    } catch {
      setError('No se pudo conectar. Verificá tu conexión a internet.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePush() {
    clearMessages();
    setBusy(true);
    try {
      const newId = await pushToGist(pat, gistId);
      const ts = String(Date.now());
      localStorage.setItem(LS_GIST_ID, newId);
      localStorage.setItem(LS_LAST_SYNC, ts);
      setGistId(newId);
      setLastSync(ts);
      setInfo('Base guardada en la nube ✓');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar en la nube.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePull() {
    if (!gistId) {
      setError('Primero guardá la base en la nube al menos una vez.');
      return;
    }
    setConfirmPull(true);
  }

  async function doPull() {
    setConfirmPull(false);
    clearMessages();
    setBusy(true);
    try {
      await pullFromGist(pat, gistId!);
      const ts = String(Date.now());
      localStorage.setItem(LS_LAST_SYNC, ts);
      setLastSync(ts);
      setInfo('Base cargada desde la nube ✓');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar desde la nube.');
    } finally {
      setBusy(false);
    }
  }

  function handleDisconnect() {
    localStorage.removeItem(LS_PAT);
    localStorage.removeItem(LS_GIST_ID);
    localStorage.removeItem(LS_LAST_SYNC);
    setPat('');
    setGistId(null);
    setLastSync(null);
    clearMessages();
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
                disabled={busy}
              />
            </div>
            <button onClick={() => void handleConnect()} disabled={busy || !patInput.trim()}>
              {busy ? 'Verificando…' : 'Conectar'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--sp-3)',
              marginBottom: 'var(--sp-4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span style={{ color: 'var(--toxic)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-small)' }}>
                ● Conectado
              </span>
              {gistId && (
                <span className="mono dim" style={{ fontSize: 'var(--fs-small)' }}>
                  gist:{gistId.slice(0, 8)}…
                </span>
              )}
            </div>
            <button className="ghost small" onClick={handleDisconnect} disabled={busy}>
              Desconectar
            </button>
          </div>

          <div style={{ marginBottom: 'var(--sp-3)' }}>
            <span className="mono dim" style={{ fontSize: 'var(--fs-small)' }}>
              Último sync: {formatSync(lastSync)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <button onClick={() => void handlePush()} disabled={busy}>
              {busy ? '…' : '↑ Guardar en nube'}
            </button>
            <button onClick={() => void handlePull()} disabled={busy || !gistId}>
              {busy ? '…' : '↓ Cargar desde nube'}
            </button>
          </div>
        </>
      )}

      {error && (
        <p
          style={{
            marginTop: 'var(--sp-3)',
            color: 'var(--blood-bright)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-small)',
          }}
        >
          {error}
        </p>
      )}
      {info && (
        <p
          style={{
            marginTop: 'var(--sp-3)',
            color: 'var(--toxic)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-small)',
          }}
        >
          {info}
        </p>
      )}

      <Modal isOpen={confirmPull} onClose={() => setConfirmPull(false)} title="¿Cargar desde nube?">
        <p
          className="serif"
          style={{ fontSize: '1.125rem', marginBottom: 'var(--sp-5)', color: 'var(--bone)' }}
        >
          Esto va a <strong style={{ color: 'var(--blood-bright)' }}>reemplazar toda la base local</strong> con
          la versión guardada en la nube. Los cambios no guardados en la nube se perderán.
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <button className="danger" onClick={() => void doPull()}>
            Sí, cargar desde nube
          </button>
          <button className="ghost" onClick={() => setConfirmPull(false)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </section>
  );
}
