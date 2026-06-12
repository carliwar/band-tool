import { useState } from 'react';
import { Modal } from '../components/Modal';
import { ExportImportPanel } from '../components/ExportImportPanel';
import { CloudSyncPanel } from '../components/CloudSyncPanel';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { listSongs, deleteAllData } from '../db/repository';
import { useDbVersion } from '../state/store';

export function Settings() {
  const dbV = useDbVersion();
  const songs = listSongs();
  const [confirmDelete, setConfirmDelete] = useState(false);
  void dbV;

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
          Zona peligrosa
        </h3>
        <p className="dim" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-small)' }}>
          Eliminá todas las canciones, fases, notas, adjuntos y sesiones de este dispositivo.
        </p>
        <button
          className="danger"
          onClick={() => setConfirmDelete(true)}
          disabled={songs.length === 0}
        >
          Borrar todo
        </button>
      </section>

      <FloatingHomeButton />

      <Modal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Borrar todo?">
        <p
          className="serif"
          style={{ fontSize: '1.125rem', marginBottom: 'var(--sp-5)', color: 'var(--bone)' }}
        >
          Se eliminarán todas las canciones, fases, notas, adjuntos y sesiones.
          <br />
          <strong style={{ color: 'var(--blood-bright)' }}>Esta acción no se puede deshacer.</strong>
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <button
            className="danger"
            onClick={() => {
              deleteAllData();
              setConfirmDelete(false);
            }}
          >
            Sí, borrar todo
          </button>
          <button className="ghost" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}
