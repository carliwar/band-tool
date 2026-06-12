import { useRef, useState } from 'react';
import { exportJson, exportSqlite } from '../db/exporters';
import { importJson, importSqlite } from '../db/importers';

export function ExportImportPanel() {
  const sqliteRef = useRef<HTMLInputElement | null>(null);
  const jsonRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSqlite = async (file: File | null) => {
    if (!file) return;
    if (!confirm('Esto va a reemplazar toda la base actual. ¿Continuar?')) return;
    setBusy(true);
    try {
      await importSqlite(file);
      alert('Importado correctamente.');
    } catch (e) {
      alert('Error importando: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  const handleJson = async (file: File | null) => {
    if (!file) return;
    if (!confirm('Esto va a reemplazar toda la base actual. ¿Continuar?')) return;
    setBusy(true);
    try {
      await importJson(file);
      alert('Importado correctamente.');
    } catch (e) {
      alert('Error importando: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      style={{
        marginTop: 'var(--sp-6)',
        paddingTop: 'var(--sp-5)',
        borderTop: '1px solid var(--char)',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h2)',
          marginBottom: 'var(--sp-3)',
        }}
      >
        Backup
      </h3>
      <p className="dim" style={{ marginBottom: 'var(--sp-4)', fontSize: 'var(--fs-small)' }}>
        Exportá la base como .sqlite o .json. Importar reemplaza todo lo guardado.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <button onClick={exportSqlite} disabled={busy}>
          Export .sqlite
        </button>
        <button onClick={exportJson} disabled={busy}>
          Export .json
        </button>
        <button onClick={() => sqliteRef.current?.click()} disabled={busy}>
          Import .sqlite
        </button>
        <button onClick={() => jsonRef.current?.click()} disabled={busy}>
          Import .json
        </button>
      </div>

      <input
        ref={sqliteRef}
        type="file"
        accept=".sqlite,application/octet-stream"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = '';
          void handleSqlite(f);
        }}
      />
      <input
        ref={jsonRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = '';
          void handleJson(f);
        }}
      />
    </section>
  );
}
