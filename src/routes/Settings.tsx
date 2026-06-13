import { useState, useEffect } from 'react';
import { ExportImportPanel } from '../components/ExportImportPanel';
import { CloudSyncPanel } from '../components/CloudSyncPanel';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import {
  hasBuildPat,
  getEffectivePat,
  LS_GIST_ID_KEY,
  setAdminPin,
  verifyAdminPin,
  hasAdminPin,
  recoverLatestWithData,
} from '../db/cloudSync';

function RecoverySection() {
  const gistId = localStorage.getItem(LS_GIST_ID_KEY);
  const pat = getEffectivePat('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!hasBuildPat || !gistId) return null;

  const handleRecover = async () => {
    setBusy(true);
    setResult(null);
    setProgress('');
    try {
      const { restored, revision } = await recoverLatestWithData(pat, gistId, setProgress);
      if (restored && revision) {
        const date = new Date(revision.committed_at);
        const pad = (n: number) => String(n).padStart(2, '0');
        const ts = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
        setResult({ ok: true, msg: `Recuperado ✓ — ${revision.song_count} canciones del ${ts}. Recargando…` });
        setTimeout(() => {
          window.location.href = import.meta.env.BASE_URL;
        }, 1500);
      } else {
        setResult({ ok: false, msg: 'No se encontró ninguna revisión con datos en el historial del Gist.' });
      }
    } catch (e) {
      setResult({ ok: false, msg: e instanceof Error ? e.message : 'Error al recuperar' });
    } finally {
      setBusy(false);
    }
  };

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
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}
      >
        Recuperar datos
      </h3>
      <p className="dim" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-small)' }}>
        Si perdiste datos, podés restaurar la última versión que tenía canciones desde el historial del Gist.
      </p>
      <button
        className="primary"
        onClick={() => void handleRecover()}
        disabled={busy}
      >
        {busy ? 'Buscando…' : 'Restaurar última versión con datos'}
      </button>
      {busy && (
        <div style={{ marginTop: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span className="spinner" />
          <span className="mono dim" style={{ fontSize: 'var(--fs-small)' }}>
            {progress || 'Iniciando…'}
          </span>
        </div>
      )}
      {result && (
        <p
          className="mono"
          style={{
            marginTop: 'var(--sp-3)',
            fontSize: 'var(--fs-small)',
            color: result.ok ? 'var(--toxic)' : 'var(--blood-bright)',
          }}
        >
          {result.msg}
        </p>
      )}
    </section>
  );
}

function AdminPinSection() {
  const gistId = localStorage.getItem(LS_GIST_ID_KEY);
  const pat = getEffectivePat('');
  const [pinExists, setPinExists] = useState<boolean | null>(null);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pat || !gistId) return;
    void hasAdminPin(pat, gistId).then(setPinExists);
  }, [pat, gistId]);

  if (!hasBuildPat || !gistId) return null;
  if (pinExists === null) return null; // loading

  const handleCreate = async () => {
    if (newPin.length < 4) { setMsg('Mínimo 4 caracteres'); return; }
    if (newPin !== confirmPin) { setMsg('Los PIN no coinciden'); return; }
    setBusy(true);
    setMsg('');
    try {
      await setAdminPin(pat, gistId, newPin);
      setPinExists(true);
      setNewPin('');
      setConfirmPin('');
      setMsg('PIN creado ✓');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async () => {
    if (!currentPin) { setMsg('Ingresá el PIN actual'); return; }
    if (newPin.length < 4) { setMsg('Mínimo 4 caracteres'); return; }
    if (newPin !== confirmPin) { setMsg('Los PIN no coinciden'); return; }
    setBusy(true);
    setMsg('');
    try {
      const ok = await verifyAdminPin(pat, gistId, currentPin);
      if (!ok) { setMsg('PIN actual incorrecto'); setBusy(false); return; }
      await setAdminPin(pat, gistId, newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setMsg('PIN actualizado ✓');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

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
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
        }}
      >
        PIN de administrador
      </h3>
      <p className="dim" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-small)' }}>
        {pinExists
          ? 'Ya hay un PIN configurado. Solo quien lo conozca podrá realizar acciones privilegiadas.'
          : 'Configurá un PIN para proteger acciones administrativas.'}
      </p>

      <div style={{ display: 'grid', gap: 'var(--sp-3)', maxWidth: '320px' }}>
        {pinExists && (
          <div>
            <label htmlFor="pin-current" style={{ fontSize: 'var(--fs-small)' }}>PIN actual</label>
            <input
              id="pin-current"
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              autoComplete="off"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        )}
        <div>
          <label htmlFor="pin-new" style={{ fontSize: 'var(--fs-small)' }}>
            {pinExists ? 'Nuevo PIN' : 'PIN'}
          </label>
          <input
            id="pin-new"
            type="password"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            placeholder="mínimo 4 caracteres"
            autoComplete="off"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <div>
          <label htmlFor="pin-confirm" style={{ fontSize: 'var(--fs-small)' }}>Confirmar PIN</label>
          <input
            id="pin-confirm"
            type="password"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            autoComplete="off"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
        <button
          className="primary small"
          onClick={() => void (pinExists ? handleChange() : handleCreate())}
          disabled={busy}
        >
          {pinExists ? 'Cambiar PIN' : 'Crear PIN'}
        </button>
        {msg && (
          <span
            className="mono"
            style={{
              fontSize: 'var(--fs-small)',
              color: msg.includes('✓') ? 'var(--toxic)' : 'var(--blood-bright)',
            }}
          >
            {msg}
          </span>
        )}
      </div>
    </section>
  );
}

export function Settings() {

  return (
    <div className="page">
      <header style={{ marginBottom: 'var(--sp-6)' }}>
        <div
          className="mono dim"
          style={{ fontSize: 'var(--fs-small)', letterSpacing: '0.2em', textTransform: 'uppercase' }}
        >
          Band tool
        </div>
        <h1
          style={{
            fontSize: 'var(--fs-display-xl)',
            color: 'var(--bone)',
            lineHeight: 0.9,
          }}
        >
          Settings
        </h1>
      </header>

      <ExportImportPanel />

      <CloudSyncPanel />

      <RecoverySection />

      <AdminPinSection />

      <FloatingHomeButton />
    </div>
  );
}
