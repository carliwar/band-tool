import { useEffect, useRef, useState } from 'react';
import { updateSong } from '../db/repository';
import type { Song } from '../types/models';

interface Props {
  song: Song;
  onWillEdit: (action: () => void) => void;
}

type Field = 'name' | 'bpm' | 'norte';

function FieldRow({
  label,
  value,
  type,
  onSave,
  multiline,
  onWillEdit,
}: {
  label: string;
  value: string;
  type: 'text' | 'number';
  onSave: (next: string) => void;
  multiline?: boolean;
  onWillEdit: Props['onWillEdit'];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (ref.current instanceof HTMLInputElement) ref.current.select();
    }
  }, [editing]);

  const start = () => {
    onWillEdit(() => setEditing(true));
  };

  const commit = () => {
    if (draft !== value) {
      onSave(draft);
    }
    setEditing(false);
  };

  return (
    <div style={{ marginBottom: 'var(--sp-3)' }}>
      <label>{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            rows={2}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            type={type}
            inputMode={type === 'number' ? 'numeric' : undefined}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(value);
                setEditing(false);
              }
            }}
          />
        )
      ) : (
        <button
          className="ghost"
          onClick={start}
          style={{
            textAlign: 'left',
            width: '100%',
            padding: 'var(--sp-3)',
            border: '2px dashed var(--char)',
            minHeight: 'var(--touch-min)',
            textTransform: 'none',
            letterSpacing: 0,
            color: value ? 'var(--bone)' : 'var(--bone-dim)',
          }}
        >
          {value || `— tocar para agregar —`}
        </button>
      )}
    </div>
  );
}

export function EditSongFields({ song, onWillEdit }: Props) {
  const set = (field: Field, raw: string) => {
    if (field === 'bpm') {
      const n = raw.trim() === '' ? null : parseInt(raw, 10);
      updateSong(song.id, { bpm: Number.isFinite(n as number) ? (n as number) : null });
    } else if (field === 'name') {
      const trimmed = raw.trim();
      if (!trimmed) return;
      try {
        updateSong(song.id, { name: trimmed });
      } catch (e) {
        alert('No se pudo renombrar (¿nombre duplicado?): ' + (e instanceof Error ? e.message : String(e)));
      }
    } else if (field === 'norte') {
      updateSong(song.id, { norte: raw.trim() || null });
    }
  };

  return (
    <div>
      <FieldRow
        label="Nombre"
        value={song.name}
        type="text"
        onSave={(v) => set('name', v)}
        onWillEdit={onWillEdit}
      />
      <FieldRow
        label="BPM"
        value={song.bpm != null ? String(song.bpm) : ''}
        type="number"
        onSave={(v) => set('bpm', v)}
        onWillEdit={onWillEdit}
      />
      <FieldRow
        label="Norte"
        value={song.norte ?? ''}
        type="text"
        multiline
        onSave={(v) => set('norte', v)}
        onWillEdit={onWillEdit}
      />
    </div>
  );
}
