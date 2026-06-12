import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { FloatingHomeButton } from '../components/FloatingHomeButton';
import { EditSongFields } from '../components/EditSongFields';
import { SessionTimer } from '../components/SessionTimer';
import { SessionControls } from '../components/SessionControls';
import { SessionsHistoryModal } from '../components/SessionsHistoryModal';
import { ScheduleTable } from '../components/ScheduleTable';
import { ScheduleRowModal } from '../components/ScheduleRowModal';
import { AttachmentsList } from '../components/AttachmentsList';
import { RulesContent } from '../components/RulesContent';
import { DeliverablesContent } from '../components/DeliverablesContent';
import { ResumeSessionModal } from '../components/ResumeSessionModal';
import { useSessionGuard } from '../state/sessionGuard';
import { getSong } from '../db/repository';
import { useDbVersion } from '../state/store';

export function Song() {
  const { id } = useParams<{ id: string }>();
  const dbV = useDbVersion();
  const songId = id ? parseInt(id, 10) : NaN;
  const song = Number.isFinite(songId) ? getSong(songId) : null;

  const [openModal, setOpenModal] = useState<'rules' | 'deliverables' | 'history' | null>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);

  const guard = useSessionGuard(song?.id ?? null);
  void dbV;

  if (!song) return <Navigate to="/" replace />;

  return (
    <div className="page">
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <div
          className="mono dim"
          style={{
            fontSize: 'var(--fs-small)',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 'var(--sp-1)',
          }}
        >
          Canción #{song.id}
        </div>

        <EditSongFields song={song} onWillEdit={guard.guard} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'var(--sp-4)',
            padding: 'var(--sp-3)',
            background: 'var(--ash)',
            borderLeft: '4px solid var(--blood)',
            gap: 'var(--sp-3)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <SessionTimer songId={song.id} />
            <button
              className="ghost small"
              onClick={() => setOpenModal('history')}
              aria-label="Ver historial de sesiones"
              title="Historial de sesiones"
              style={{ padding: 'var(--sp-2)', minWidth: 36, minHeight: 36 }}
            >
              ☰
            </button>
          </div>
          <SessionControls songId={song.id} />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-2)',
            marginTop: 'var(--sp-3)',
            flexWrap: 'wrap',
          }}
        >
          <button className="small" onClick={() => setOpenModal('rules')}>
            Reglas
          </button>
          <button className="small" onClick={() => setOpenModal('deliverables')}>
            Entregables
          </button>
        </div>
      </header>

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-h1)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          Cronograma
        </h2>
        <ScheduleTable
          songId={song.id}
          onRowClick={(pid) => setActivePhase(pid)}
          onWillEdit={guard.guard}
        />
      </section>

      <section style={{ marginBottom: 'var(--sp-6)' }}>
        <AttachmentsList songId={song.id} onWillEdit={guard.guard} />
      </section>

      <Modal
        isOpen={openModal === 'rules'}
        onClose={() => setOpenModal(null)}
        title="Reglas fijas"
      >
        <RulesContent />
      </Modal>

      <Modal
        isOpen={openModal === 'deliverables'}
        onClose={() => setOpenModal(null)}
        title="Entregables"
      >
        <DeliverablesContent />
      </Modal>

      <SessionsHistoryModal
        songId={song.id}
        isOpen={openModal === 'history'}
        onClose={() => setOpenModal(null)}
      />

      <ScheduleRowModal
        songId={song.id}
        phaseId={activePhase}
        onClose={() => setActivePhase(null)}
        onWillEdit={guard.guard}
      />

      <ResumeSessionModal
        isOpen={guard.isModalOpen}
        onConfirm={guard.confirmAndStartSession}
        onCancel={guard.cancel}
      />

      <FloatingHomeButton />
    </div>
  );
}
