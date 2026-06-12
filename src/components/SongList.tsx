import { useNavigate } from 'react-router-dom';
import type { Song } from '../types/models';
import { getTotalElapsed } from '../db/repository';
import styles from '../styles/SongList.module.css';

interface Props {
  songs: Song[];
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatElapsed(ms: number): string {
  if (ms < 60_000) return '< 1 min';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function SongList({ songs }: Props) {
  const nav = useNavigate();
  return (
    <div className={styles.list}>
      {songs.map((s) => {
        const elapsed = getTotalElapsed(s.id);
        return (
          <button key={s.id} className={styles.card} onClick={() => nav(`/song/${s.id}`)}>
            <div className={styles.cardRow}>
              <div>
                <div className={styles.name}>{s.name}</div>
                <div className={styles.meta}>
                  {s.bpm != null && <span className={styles.bpm}>{s.bpm} BPM</span>}
                  <span>actualizada {formatDate(s.updated_at)}</span>
                </div>
              </div>
              {elapsed > 0 && (
                <div className={styles.elapsed}>{formatElapsed(elapsed)}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
