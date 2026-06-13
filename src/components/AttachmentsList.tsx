import { useRef, useState } from 'react';
import {
  addFile,
  addLink,
  getAttachmentBlob,
  listAttachments,
} from '../db/repository';
import { useDbVersion } from '../state/store';

interface Props {
  songId: number;
  onWillEdit: (action: () => void) => void;
}

function formatBytes(n: number | null): string {
  if (n == null) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function downloadFromBlob(label: string, mime: string | null, bytes: Uint8Array) {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const blob = new Blob([buf], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = label;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AttachmentsList({ songId, onWillEdit }: Props) {
  const dbV = useDbVersion();
  const items = listAttachments(songId);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  void dbV;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    onWillEdit(() => {
      void addFile(songId, file.name, file);
    });
  };

  const submitLink = () => {
    const l = linkLabel.trim();
    const u = linkUrl.trim();
    if (!l || !u) return;
    onWillEdit(() => {
      addLink(songId, l, u);
      setLinkLabel('');
      setLinkUrl('');
      setShowLinkForm(false);
    });
  };

  return (
    <section>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-h2)',
          marginBottom: 'var(--sp-3)',
        }}
      >
        Archivos y links
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        <button onClick={() => fileRef.current?.click()}>+ Archivo</button>
        <button onClick={() => setShowLinkForm((x) => !x)}>+ Link</button>
        <input
          ref={fileRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = '';
            void handleFile(f);
          }}
        />
      </div>

      {showLinkForm && (
        <div
          style={{
            background: 'var(--ash)',
            padding: 'var(--sp-3)',
            marginBottom: 'var(--sp-4)',
            display: 'grid',
            gap: 'var(--sp-2)',
          }}
        >
          <div>
            <label htmlFor="att-label">Label</label>
            <input
              id="att-label"
              type="text"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="ej. Demo Drive"
            />
          </div>
          <div>
            <label htmlFor="att-url">URL</label>
            <input
              id="att-url"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <button className="primary small" onClick={submitLink}>Guardar link</button>
            <button className="small" onClick={() => setShowLinkForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="dim">Sin archivos ni links.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {items.map((a) => (
            <li
              key={a.id}
              style={{
                background: 'var(--ash)',
                padding: 'var(--sp-3)',
                borderLeft: `3px solid ${a.kind === 'link' ? 'var(--gold)' : 'var(--toxic)'}`,
                display: 'flex',
                gap: 'var(--sp-3)',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 'var(--fs-small)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: a.kind === 'link' ? 'var(--gold)' : 'var(--toxic)',
                  flex: '0 0 auto',
                }}
              >
                {a.kind}
              </span>
              <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                <div style={{ fontWeight: 600 }}>{a.label}</div>
                {a.kind === 'link' && a.url && (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 'var(--fs-small)' }}>
                    {a.url}
                  </a>
                )}
                {a.kind === 'file' && (
                  <div className="dim mono" style={{ fontSize: 'var(--fs-small)' }}>
                    {a.mime || 'archivo'} · {formatBytes(a.size)}
                  </div>
                )}
              </div>
              {a.kind === 'file' && (
                <button
                  className="small"
                  onClick={() => {
                    const got = getAttachmentBlob(a.id);
                    if (got) downloadFromBlob(got.label, got.mime, got.blob);
                  }}
                >
                  Descargar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
