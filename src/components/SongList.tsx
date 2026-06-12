import { useNavigate } from 'react-router-dom';
import type { Song } from '../types/models';
import styles from '../styles/SongList.module.css';

interface Props {
  songs: Song[];
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function SongList({ songs }: Props) {
  const nav = useNavigate();
  return (
    <div className={styles.list}>
      {songs.map((s) => (
        <button key={s.id} className={styles.card} onClick={() => nav(`/song/${s.id}`)}>
          <div className={styles.name}>{s.name}</div>
          <div className={styles.meta}>
            {s.bpm != null && <span className={styles.bpm}>{s.bpm} BPM</span>}
            <span>actualizada {formatDate(s.updated_at)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
