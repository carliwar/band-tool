import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { listSessions } from '../db/repository';
import { useDbVersion } from '../state/store';

interface Props {
  songId: number;
  isOpen: boolean;
  onClose: () => void;
}

const MESES_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function formatDate(ts: number): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MESES_ES[d.getMonth()];
  return `${day}/${month}/${d.getFullYear()}`;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function SessionsHistoryModal({ songId, isOpen, onClose }: Props) {
  const dbV = useDbVersion();
  const sessions = listSessions(songId);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const hasActive = sessions.some((s) => s.ended_at == null);
    if (!hasActive) return;
    const i = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, [isOpen, sessions.length]);

  void dbV;
  void tick;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial de sesiones">
      {sessions.length === 0 ? (
        <p className="dim">Todavía no hay sesiones registradas.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {sessions.map((s) => {
            const now = Date.now();
            const end = s.ended_at ?? now;
            const dur = end - s.started_at;
            const active = s.ended_at == null;
            return (
              <li
                key={s.id}
                style={{
                  background: 'var(--ash)',
                  borderLeft: `4px solid ${active ? 'var(--blood)' : 'var(--gold)'}`,
                  padding: 'var(--sp-3) var(--sp-4)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--sp-3)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div className="mono" style={{ fontSize: 'var(--fs-small)', color: 'var(--bone-dim)' }}>
                    Sesión #{s.id}
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatDate(s.started_at)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {active && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 'var(--fs-small)',
                        color: 'var(--blood-bright)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        display: 'block',
                      }}
                    >
                      En curso
                    </span>
                  )}
                  <span className="mono" style={{ fontWeight: 700 }}>
                    {formatDuration(dur)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
