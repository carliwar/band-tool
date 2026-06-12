import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('band-tool-theme') as Theme | null) ?? 'dark',
  );

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('band-tool-theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      style={{
        position: 'fixed',
        top: 'var(--sp-4)',
        right: 'var(--sp-4)',
        zIndex: 200,
        minHeight: 'var(--touch-min)',
        padding: 'var(--sp-2) var(--sp-3)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-small)',
        letterSpacing: '0.08em',
        background: 'var(--ash)',
        border: '2px solid var(--char)',
        color: 'var(--bone)',
      }}
    >
      {theme === 'dark' ? '☀ CLARO' : '◗ OSCURO'}
    </button>
  );
}
