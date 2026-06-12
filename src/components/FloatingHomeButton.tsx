import { useNavigate } from 'react-router-dom';
import styles from '../styles/FloatingHomeButton.module.css';

export function FloatingHomeButton() {
  const nav = useNavigate();
  return (
    <button
      className={styles.btn}
      onClick={() => nav('/')}
      aria-label="Volver al inicio"
      title="Volver al inicio"
    >
      ⌂
    </button>
  );
}
