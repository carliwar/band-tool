import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './routes/Home';
import { Song } from './routes/Song';
import { Settings } from './routes/Settings';
import { ThemeToggle } from './components/ThemeToggle';
import { PinAccessGate, hasValidPinSession } from './components/PinAccessGate';
import { initDb } from './db/database';

export function App() {
  const [isUnlocked, setIsUnlocked] = useState(hasValidPinSession);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUnlocked) return;

    initDb().then(
      () => setReady(true),
      (e) => setError(e instanceof Error ? e.message : String(e)),
    );
  }, [isUnlocked]);

  if (!isUnlocked) {
    return <PinAccessGate onUnlock={() => setIsUnlocked(true)} />;
  }

  if (error) {
    return (
      <div className="page">
        <h1 style={{ color: 'var(--blood-bright)', marginBottom: 'var(--sp-3)' }}>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div
        className="page"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <p
          className="mono dim"
          style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}
        >
          Cargando…
        </p>
      </div>
    );
  }

  return (
    <>
      <ThemeToggle />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/song/:id" element={<Song />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
