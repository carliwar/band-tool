import { Modal } from './Modal';
import { RowNotesList } from './RowNotesList';
import { RulesContent } from './RulesContent';
import { SCHEDULE_TEMPLATE } from '../data/scheduleTemplate';
import { listProgress, setSchedulePhase } from '../db/repository';
import { useDbVersion } from '../state/store';

interface Props {
  songId: number;
  phaseId: string | null;
  onClose: () => void;
  onWillEdit: (action: () => void) => void;
}

function formatTs(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleRowModal({ songId, phaseId, onClose, onWillEdit }: Props) {
  const dbV = useDbVersion();
  const row = phaseId ? SCHEDULE_TEMPLATE.find((r) => r.id === phaseId) : null;
  const progress = phaseId ? listProgress(songId).find((p) => p.phase_id === phaseId) : null;
  void dbV;

  if (!row) return null;

  const done = !!progress?.completed;

  return (
    <Modal isOpen={!!phaseId} onClose={onClose} title={row.fase}>
      <section style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="mono dim" style={{ fontSize: 'var(--fs-small)', marginBottom: 'var(--sp-2)' }}>
          {row.tiempo}
        </div>

        <p className="serif" style={{ fontSize: '1.125rem', marginBottom: 'var(--sp-4)' }}>
          {row.actividad}
        </p>

        <div style={{ display: 'grid', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
          <div>
            <label>Quién</label>
            <div>{row.quien}</div>
          </div>
          <div>
            <label>Entregable parcial</label>
            <div>{row.entregableParcial}</div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--sp-3)',
            padding: 'var(--sp-3)',
            background: 'var(--ash)',
            borderLeft: `4px solid ${done ? 'var(--blood)' : 'var(--char)'}`,
            flexWrap: 'wrap',
          }}
        >
          <button
            className={done ? 'primary' : ''}
            onClick={() => onWillEdit(() => setSchedulePhase(songId, row.id, !done))}
          >
            {done ? '✓ Completado' : 'Marcar como completado'}
          </button>
          {done && progress?.completed_at && (
            <span className="mono dim" style={{ fontSize: 'var(--fs-small)' }}>
              {formatTs(progress.completed_at)}
            </span>
          )}
        </div>
      </section>

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <RowNotesList songId={songId} phaseId={row.id} onWillEdit={onWillEdit} />
      </section>

      <section
        style={{
          marginTop: 'var(--sp-6)',
          paddingTop: 'var(--sp-5)',
          borderTop: '2px solid var(--char)',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h2)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          Reglas fijas
        </h3>
        <RulesContent />
      </section>
    </Modal>
  );
}
