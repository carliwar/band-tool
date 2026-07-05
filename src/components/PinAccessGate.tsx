import { useState } from 'react';
import type { FormEvent } from 'react';
import styles from '../styles/PinAccessGate.module.css';

const ACCESS_PIN = '4924';
const SESSION_MS = 10 * 60 * 60 * 1000;
const SESSION_KEY = 'band-tool-pin-session-v1';

type SessionPayload = {
  expiresAt: number;
};

export function hasValidPinSession(): boolean {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as SessionPayload;
    const valid = Number.isFinite(parsed.expiresAt) && parsed.expiresAt > Date.now();

    if (!valid) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function createPinSession() {
  const payload: SessionPayload = {
    expiresAt: Date.now() + SESSION_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

type PinAccessGateProps = {
  onUnlock: () => void;
};

export function PinAccessGate({ onUnlock }: PinAccessGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pin.length !== 4) {
      setError('Ingresá un PIN de 4 dígitos.');
      return;
    }

    if (pin !== ACCESS_PIN) {
      setError('PIN incorrecto.');
      return;
    }

    createPinSession();
    setError(null);
    onUnlock();
  };

  return (
    <div className={`page ${styles.page}`}>
      <section className={styles.card}>
        <div className={`mono dim ${styles.kicker}`}>
          Acceso
        </div>
        <h1 className={styles.title}>
          Ingresá PIN
        </h1>

        <form onSubmit={submit}>
          <label htmlFor="access-pin">PIN (4 dígitos)</label>
          <input
            id="access-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(next);
              if (error) setError(null);
            }}
          />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button className={`primary ${styles.submit}`} type="submit">
            Entrar
          </button>
        </form>

        <p className={`mono dim ${styles.note}`}>
          La sesión se mantiene por hasta 10 horas en este navegador.
        </p>
      </section>
    </div>
  );
}