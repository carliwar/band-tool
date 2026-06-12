import { useState } from 'react';
import { Modal } from '../components/Modal';
import { CreateSongForm } from '../components/CreateSongForm';
import { SongList } from '../components/SongList';
import { ExportImportPanel } from '../components/ExportImportPanel';
import { CloudSyncPanel } from '../components/CloudSyncPanel';
import { listSongs, deleteAllData } from '../db/repository';
import { useDbVersion } from '../state/store';

export function Home() {
  const dbV = useDbVersion();
  const songs = listSongs();
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  void dbV;

  const empty = songs.length === 0;

  return (
    <div className="page">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 'var(--sp-6)',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
        }}
      >
        <div>
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
            Maquetas
          </h1>
        </div>
        {!empty && (
          <button className="primary" onClick={() => setCreating(true)}>
            + Nueva canción
          </button>
        )}
      </header>

      {empty ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--sp-8) var(--sp-4)',
            textAlign: 'center',
            gap: 'var(--sp-4)',
            minHeight: '40vh',
          }}
        >
          <p className="serif dim" style={{ fontSize: '1.25rem', maxWidth: 320 }}>
            Sin canciones todavía. Arrancá la primera maqueta.
          </p>
          <button
            className="primary"
            onClick={() => setCreating(true)}
            style={{
              width: 96,
              height: 96,
              fontSize: '3rem',
              padding: 0,
              fontFamily: 'var(--font-display)',
            }}
            aria-label="Crear nueva canción"
          >
            +
          </button>
        </div>
      ) : (
        <SongList songs={songs} />
      )}

      <ExportImportPanel />

      <CloudSyncPanel />

      {songs.length > 0 && (
        <div style={{ marginTop: 'var(--sp-6)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="danger small" onClick={() => setConfirmDelete(true)}>
            Borrar todo
          </button>
        </div>
      )}

      <Modal isOpen={creating} onClose={() => setCreating(false)} title="Nueva canción">
        <CreateSongForm onCancel={() => setCreating(false)} />
      </Modal>

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
