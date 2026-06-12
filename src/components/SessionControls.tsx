import { endSession, getActiveSession, startSession } from '../db/repository';
import { useDbVersion } from '../state/store';

interface Props {
  songId: number;
}

export function SessionControls({ songId }: Props) {
  const dbV = useDbVersion();
  const active = getActiveSession(songId);
  void dbV;

  return (
    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
      {active ? (
        <button onClick={() => endSession(songId)} className="small">
          Finalizar sesión
        </button>
      ) : (
        <button onClick={() => startSession(songId)} className="primary small">
          Nueva sesión
        </button>
      )}
    </div>
  );
}
