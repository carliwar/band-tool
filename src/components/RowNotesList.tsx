import { useState } from 'react';
import { addNote, deleteNote, listNotes } from '../db/repository';
import { useDbVersion } from '../state/store';

interface Props {
  songId: number;
  phaseId: string;
  onWillEdit: (action: () => void) => void;
}

function formatTs(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RowNotesList({ songId, phaseId, onWillEdit }: Props) {
  const dbV = useDbVersion();
  const notes = listNotes(songId, phaseId);
  const [draft, setDraft] = useState('');
  void dbV;

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    onWillEdit(() => {
      addNote(songId, phaseId, t);
      setDraft('');
    });
  };

  return (
    <div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h2)',
          marginBottom: 'var(--sp-3)',
        }}
      >
        Notas
      </h3>

      <div
        style={{
          display: 'flex',
          gap: 'var(--sp-2)',
          marginBottom: 'var(--sp-4)',
          flexWrap: 'wrap',
        }}
      >
        <textarea
          placeholder="Nueva nota…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          style={{ flex: '1 1 240px', minWidth: 0 }}
        />
        <button onClick={submit} className="primary" style={{ alignSelf: 'flex-end' }}>
          Agregar
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="dim">Sin notas todavía.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {notes.map((n) => (
            <li
              key={n.id}
              style={{
                background: 'var(--ash)',
                padding: 'var(--sp-3)',
                borderLeft: '3px solid var(--gold)',
                display: 'flex',
                gap: 'var(--sp-3)',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 'var(--fs-small)', color: 'var(--bone-dim)' }}>
                  {formatTs(n.created_at)}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{n.text}</div>
              </div>
              <button
                className="ghost small"
                onClick={() => onWillEdit(() => deleteNote(n.id, songId))}
                aria-label="Eliminar nota"
                title="Eliminar"
                style={{ flex: '0 0 auto' }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
