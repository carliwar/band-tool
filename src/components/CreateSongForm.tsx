import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { upsertSongByName, startSession, getActiveSession } from '../db/repository';

interface Props {
  onCancel: () => void;
}

export function CreateSongForm({ onCancel }: Props) {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState('');
  const [norte, setNorte] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre es obligatorio.');
      return;
    }
    try {
      const song = upsertSongByName({
        name: trimmed,
        bpm: bpm ? parseInt(bpm, 10) : null,
        norte: norte.trim() || null,
      });
      // Start session automatically only if there isn't one already (e.g. just navigated back to existing)
      if (!getActiveSession(song.id)) {
        startSession(song.id);
      }
      nav(`/song/${song.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <label htmlFor="song-name">Nombre de la canción *</label>
        <input
          id="song-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <label htmlFor="song-bpm">BPM</label>
        <input
          id="song-bpm"
          type="number"
          inputMode="numeric"
          value={bpm}
          onChange={(e) => setBpm(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <label htmlFor="song-norte">Norte (frase corta que define la canción)</label>
        <textarea
          id="song-norte"
          value={norte}
          onChange={(e) => setNorte(e.target.value)}
          rows={2}
        />
      </div>

      {error && (
        <p className="blood" style={{ marginBottom: 'var(--sp-3)' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <button type="submit" className="primary" style={{ flex: '1 1 200px' }}>
          Crear y empezar
        </button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
