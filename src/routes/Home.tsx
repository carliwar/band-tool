import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { CreateSongForm } from '../components/CreateSongForm';
import { SongList } from '../components/SongList';
import { listSongs } from '../db/repository';
import { useDbVersion } from '../state/store';

export function Home() {
  const dbV = useDbVersion();
  const songs = listSongs();
  const [creating, setCreating] = useState(false);
  const nav = useNavigate();
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

      <div style={{ marginTop: 'var(--sp-6)', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="ghost small" onClick={() => nav('/settings')}>
          ⚙ Settings
        </button>
      </div>

      <Modal isOpen={creating} onClose={() => setCreating(false)} title="Nueva canción">
        <CreateSongForm onCancel={() => setCreating(false)} />
      </Modal>
    </div>
  );
}
