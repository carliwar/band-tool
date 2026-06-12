import { useEffect, type ReactNode } from 'react';
import styles from '../styles/Modal.module.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
  wide?: boolean;
}

export function Modal({ isOpen, onClose, title, children, aside, wide }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={[styles.modal, wide ? styles.wide : ''].filter(Boolean).join(' ')}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {aside ? (
          <div className={styles.cols}>
            <div className={styles.leftCol}>{children}</div>
            <div className={styles.rightCol}>{aside}</div>
          </div>
        ) : (
          <div className={styles.body}>{children}</div>
        )}
      </div>
    </div>
  );
}
