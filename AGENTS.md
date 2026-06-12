# AGENTS.md — band-tool

Contexto para asistentes de IA trabajando en este repo. Lean este archivo antes de hacer cambios.

## Qué es esto

SPA **mobile-first** para gestionar maquetas de canciones de una banda de metal. Cronograma de sesión predefinido, notas por fase, archivos/links, multi-sesión con cronómetro. **Local-first**: SQLite real corre en el browser (sql.js + wasm), persistido en IndexedDB. Sin backend.

Estilo visual: **Kerrang + metal moderno** (Sleep Token, Bring Me The Horizon, Bad Omens).

## Idioma

- **Conversación con el usuario: español.**
- Código, identificadores, comentarios técnicos: inglés.
- Strings de UI visibles al usuario: español (ej. "Nueva sesión", "Sin sesión activa").
- Fechas en UI: formato `dd/MMMM/yyyy` con mes en español (ej. `12/junio/2026`). Ver `MESES_ES` en `SessionsHistoryModal.tsx`.

## Stack

| Pieza | Versión / detalle |
|---|---|
| Node | 20+ (usar `nvm use 20`) |
| Vite | 8.x |
| React | 19 + TypeScript |
| Routing | react-router-dom (BrowserRouter con `basename` derivado de `import.meta.env.BASE_URL`) |
| DB | sql.js (SQLite wasm) — wasm importado vía `import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'`, Vite lo bundlea con hash |
| Persistencia | idb-keyval (blob SQLite en IndexedDB key `band-tool-db-v1`) |
| Estado | mínimo: `useDbVersion()` hook + custom event subscription, sin Redux/Zustand a pesar de estar instalado |
| Estilos | CSS Modules + variables CSS en `src/styles/tokens.css`, sin framework UI |
| Fuentes | Google Fonts cargadas en `index.html`: Anton, Cormorant Garamond, Inter, Space Mono |

## Comandos

```bash
nvm use 20
npm install
npm run dev        # http://localhost:5173/band-tool/
npm run build      # → dist/
npm run preview    # sirve dist/ local
```

## Convenciones de código

### Arquitectura

- **Single source of truth = SQLite en memoria** (sql.js). Todo cambio pasa por `src/db/repository.ts`.
- Cada función mutadora del repo llama a `notifyChange()` al final → dispara auto-save debounced (300ms) a IndexedDB + notifica subscribers.
- Componentes leen del repo directamente (no hay cache intermedia). Para re-render reactivo usan `useDbVersion()` de `src/state/store.ts`.
- **No hay botón "Guardar"**. Todo cambio se persiste automáticamente.

### Templates fijos

`src/data/scheduleTemplate.ts`, `rulesTemplate.ts`, `deliverablesTemplate.ts` son la **fuente única** de las fases del cronograma, reglas y entregables. NO se editan desde la UI (decisión de scope). Cambiar el template requiere edición de código.

### Mobile-first

- Diseñar primero a 360–414px, escalar con `@media (min-width: 768px)`.
- Touch targets ≥ 44×44px (var `--touch-min`).
- Inputs `font-size: 16px` mínimo (evita zoom iOS).
- Cronograma: cards apiladas en móvil, tabla en desktop.
- Modales: 100vh en móvil con header sticky + botón cerrar grande arriba derecha, max-width 760px en desktop.

### Estilos

- Paleta: `--ink` `--ash` `--char` `--bone` `--bone-dim` `--blood` `--blood-bright` `--gold` `--toxic`. Definida en `src/styles/tokens.css`.
- Bordes duros, **sin border-radius**.
- Display headers en `var(--font-display)` (Anton/Bebas Neue), mayúsculas, `letter-spacing: 0.02em`.
- Monoespaciada (`var(--font-mono)`) para timestamps, IDs y datos de sistema.
- CSS Modules para componentes (`*.module.css` en `src/styles/`).

## Reglas críticas (NO violar sin acuerdo del usuario)

1. **Botón "Borrar todo" existe con confirmación custom.** Elimina todos los datos vía `deleteAllData()` en `repository.ts`. El modal de confirmación usa `Modal.tsx` (no `window.confirm`).
2. **Edición fuera de sesión requiere confirm.** Cualquier mutación (campo, checkbox, nota, attachment) debe pasar por `guard.guard(action)` del hook `useSessionGuard(songId)`. Si no hay sesión activa, abre `ResumeSessionModal`. Solo aplica si el usuario confirma (y se crea sesión nueva automáticamente).
3. **Cada "Nueva sesión" es un row nuevo** en `work_sessions` (FK a song). Nunca actualizar `started_at` de una sesión existente.
4. **Auto-save sin botón**. Todo cambio = `notifyChange()` → flush debounced.
5. **Nombre de canción es UNIQUE.** Al crear, usar `upsertSongByName` (devuelve la existente si ya existe).
6. **Modal fullscreen reutilizable** = `src/components/Modal.tsx`. Cualquier modal nuevo debe envolverse en este. Cierra con Esc + click overlay + botón cerrar.
7. **Mobile-first siempre**. Verificar a 375px antes de mergear.
8. **Sin tests automáticos** por ahora (decisión de scope).
9. **Templates del cronograma viven en código, no en UI.**

## Layout de datos

```
songs (id, name UNIQUE, bpm, norte, ref_instrumental, ref_vocal, concept_word, concept_phrase, created_at, updated_at)
schedule_progress (song_id, phase_id, completed, completed_at)   -- PK (song_id, phase_id)
phase_notes (id, song_id, phase_id, text, created_at)             -- N notas por fase
attachments (id, song_id, kind ['link'|'file'], label, url, mime, blob, size, created_at)
work_sessions (id, song_id, started_at, ended_at)                 -- ended_at NULL = activa
```

Ver `src/db/database.ts` para el SCHEMA exacto (con `IF NOT EXISTS`).

## Estructura de carpetas

```
src/
  routes/      Home.tsx · Song.tsx
  components/  Modal · ScheduleTable/RowModal · RowNotesList · AttachmentsList · SessionTimer/Controls/HistoryModal · EditSongFields · ResumeSessionModal · CreateSongForm · SongList · ExportImportPanel · FloatingHomeButton · RulesContent · DeliverablesContent
  db/          database · repository · exporters · importers
  state/       store (useDbVersion) · sessionGuard
  data/        scheduleTemplate · rulesTemplate · deliverablesTemplate
  styles/      tokens · global · *.module.css
  types/       models
public/        favicon · icons    (NOTE: sql-wasm.wasm NO va acá — Vite lo bundlea vía `?url` import)
.github/workflows/deploy.yml      (GitHub Pages, push a main)
```

## Despliegue

GitHub Pages + GitHub Actions. Push a `main` → `.github/workflows/deploy.yml` builda y publica.

- `vite.config.ts` tiene `base: '/band-tool/'` — si cambia el nombre del repo, ajustar acá.
- `BrowserRouter` usa `basename={import.meta.env.BASE_URL.replace(/\/$/, '')}` → funciona en dev (`/band-tool`) y prod sin tocar nada.

## Si vas a agregar features

1. Leer este archivo + `docs/prompts-history.md` para entender el historial de decisiones.
2. Verificar que el feature no viole una "regla crítica" de arriba.
3. Si toca DB: agregar tabla/columna al SCHEMA en `database.ts` con `IF NOT EXISTS`; agregar tipos en `types/models.ts`; agregar funciones en `repository.ts` con `notifyChange()` al final; extender `exporters.ts` e `importers.ts`.
4. Si toca UI: mobile-first, usar Modal reutilizable si es modal, usar guard de sesión si es edición.
5. Anotar el cambio en `docs/prompts-history.md` con el prompt original del usuario.

## Cosas que NO hay que hacer

- No agregar markdown files de docs sin pedirlo el usuario (excepto `docs/prompts-history.md` que ya está aprobado).
- No agregar dependencias UI (Tailwind, MUI, etc.) — el sistema de tokens es a propósito.
- No agregar tests automáticos sin pedirlo.
- No agregar sync cloud sin pedirlo (implementado en `src/db/cloudSync.ts` + `src/components/CloudSyncPanel.tsx` — GitHub Gist + PAT, scope `gist`).
- No tocar el blob de `band-tool-db-v1` en IndexedDB directamente — usar siempre el repo.
- No copiar `sql-wasm.wasm` a `public/` — Vite lo bundlea automáticamente via `?url` import (el archivo en `public/` quedó como remanente y puede borrarse en una limpieza).
