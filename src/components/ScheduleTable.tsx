import { SCHEDULE_TEMPLATE } from '../data/scheduleTemplate';
import { listNotes, listProgress, setSchedulePhase } from '../db/repository';
import { useDbVersion } from '../state/store';
import styles from '../styles/ScheduleTable.module.css';

interface Props {
  songId: number;
  onRowClick: (phaseId: string) => void;
  onWillEdit: (action: () => void) => void;
}

export function ScheduleTable({ songId, onRowClick, onWillEdit }: Props) {
  const dbV = useDbVersion();
  const progress = listProgress(songId);
  const progressMap = new Map(progress.map((p) => [p.phase_id, p]));
  void dbV;

  return (
    <div className={styles.wrap}>
      {SCHEDULE_TEMPLATE.map((row) => {
        const p = progressMap.get(row.id);
        const done = !!p?.completed;
        const noteCount = listNotes(songId, row.id).length;
        return (
          <div
            key={row.id}
            className={`${styles.row} ${done ? styles.done : ''}`}
            onClick={() => onRowClick(row.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRowClick(row.id);
              }
            }}
          >
            <button
              className={styles.check}
              onClick={(e) => {
                e.stopPropagation();
                onWillEdit(() => setSchedulePhase(songId, row.id, !done));
              }}
              aria-label={done ? 'Marcar como pendiente' : 'Marcar como completado'}
            >
              {done ? '✓' : ''}
            </button>
            <div className={styles.body}>
              <div className={styles.time}>{row.tiempo}</div>
              <div className={styles.fase}>{row.fase}</div>
              <div className={styles.who}>{row.quien}</div>
            </div>
            {noteCount > 0 && (
              <span className={styles.badge}>
                {noteCount} {noteCount === 1 ? 'nota' : 'notas'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
