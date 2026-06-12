import { Modal } from './Modal';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResumeSessionModal({ isOpen, onConfirm, onCancel }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Sin sesión activa">
      <p className="serif" style={{ fontSize: '1.25rem', marginBottom: 'var(--sp-4)' }}>
        Estás editando fuera de una sesión.
      </p>
      <p style={{ marginBottom: 'var(--sp-5)' }}>
        ¿Iniciar una nueva sesión para registrar el tiempo de trabajo?
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <button onClick={onConfirm} className="primary" style={{ flex: '1 1 220px' }}>
          Sí, iniciar sesión y editar
        </button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    </Modal>
  );
}
