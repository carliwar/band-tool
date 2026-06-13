# Prompts History — band-tool

Registro cronológico de prompts del usuario, decisiones tomadas y archivos afectados. Este archivo es la **memoria narrativa** del proyecto. Lean antes de hacer cambios para entender por qué las cosas están como están.

**Formato de cada entrada:**
- `### YYYY-MM-DD — Título corto`
- **Prompt** (resumen de lo pedido)
- **Decisión / qué se hizo** (cambios concretos)
- **Archivos afectados**
- **Notas / razones** (cuando hay tradeoff o decisión no obvia)

---

## 2026-06-12 — Génesis del proyecto

### Prompt 1 — Metodología de sesión de maqueta
El usuario pidió método para que la banda (metal, no pop/reggaetón como se asumió inicialmente) fluya en una sesión de maqueta de 1 canción. Tienen DAW listo, MIDI de Guitar Pro exportado (incluye batería sampleada), tono directo de pedales digitales, sin necesidad de DI.

**Resultado:** Cronograma de 9 fases sin pausas, con reglas fijas (norte, bloques por frase musical, regla 15 min, productor+ingeniero con sombreros separados, etc.) y entregables. → Quedó como template fijo en `src/data/*.ts`.

### Prompt 2 — Crear sitio para gestionar el proceso
Pidió app/sitio con:
- Modal fullscreen reutilizable para reglas y otros (botón desplegable).
- Cronograma en formato tabla con checkboxes que persisten.
- Persistencia local exportable (JSON o SQLite).
- ID por nombre de canción (luego cambió: ID autoincrement, nombre solo para validar unicidad).
- Al clickear fila → modal con detalle + reglas debajo.
- Auto-save sin botón.
- Floating button "volver al inicio" siempre.
- Si hay canciones guardadas, mostrar lista; si no, botón `+`.
- Estilo **Kerrang** + metal moderno (Sleep Token, BMTH, Bad Omens).

**Decisiones tomadas (con preguntas en `vscode_askQuestions`):**
- Stack: React + Vite + TS (mobile-first), sin backend.
- Persistencia: sql.js (SQLite real en wasm) + IndexedDB para portabilidad del blob.
- Ubicación: `~/code/band-tool` (fuera del workspace .NET).
- Modal de fila: display + checkbox con timestamp + notas + botón "finalizar sesión" con tiempo acumulado.

**Archivos:** estructura inicial completa del proyecto.

### Prompt 3 — Refinamientos
- **Mobile-first** explícito.
- Notas por fila como **lista** (no input simple); cada nota = texto + timestamp; agregable/eliminable.
- Despliegue gratis con CI/CD → recomendación: **GitHub Pages + GitHub Actions** (workflow `.github/workflows/deploy.yml`).
- Edición de canción permitida; si **no hay sesión activa**, abrir modal de confirmación "¿Iniciar nueva sesión?" antes de aplicar el cambio. → Implementado en `src/state/sessionGuard.ts` + `ResumeSessionModal.tsx`.
- **NO** botón "Borrar todo" (decisión explícita, no lo quería).
- **Attachments** (archivos + links) por canción, lista a nivel canción (no por fila). Files guardados como BLOB en SQLite → viajan en export.
- Sync cloud: marcado como **Fase 9 opcional** vía GitHub Gist + PAT (no implementado todavía).

### Prompt 4 — Sesiones como registros separados + historial
- Cada "Nueva sesión" inserta un **row nuevo** en `work_sessions` con FK a la canción (nunca actualizar `started_at` de una existente).
- UI muestra tiempo total acumulado (suma de cerradas + tiempo vivo de la activa).
- Botón pequeño junto al timer abre `SessionsHistoryModal` con lista de sesiones: fecha `dd/MMMM/yyyy` (mes en español, ej. `12/junio/2026`) y duración `Xh Ym`. Sesión activa = badge "En curso" con duración en vivo. Orden desc por `started_at`.

**Archivos:** `src/components/SessionsHistoryModal.tsx` (con array `MESES_ES`).

### Prompt 5 — Implementación
Ejecutó bootstrap + 11 fases. Build OK (99KB gzip). Dev server arrancó en `http://localhost:5173/band-tool/`.

**Detalles técnicos importantes:**
- Workaround TS para `Uint8Array` → `BlobPart` en `exporters.ts` y `AttachmentsList.tsx`: copiar bytes a un `ArrayBuffer` fresco antes de `new Blob([buf])`. Razón: TS 5.x con DOM lib estricta no acepta `Uint8Array<ArrayBufferLike>` por posible `SharedArrayBuffer`.
- `BrowserRouter` usa `basename={import.meta.env.BASE_URL.replace(/\/$/, '')}` para que funcione en dev y prod con el `base: '/band-tool/'` de Vite.

### Edit del usuario post-bootstrap — wasm via import URL
Cambió `src/db/database.ts` para importar el wasm vía `import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url'` y usarlo en `locateFile: () => sqlWasmUrl`. También limpió `optimizeDeps.exclude` del `vite.config.ts`. Razón: deja que Vite bundlee el wasm con hash automáticamente (cache-busting + sin copia manual a `public/`).

**Implicancia:** `public/sql-wasm.wasm` quedó obsoleto, se puede borrar en próxima limpieza. Documentado en `AGENTS.md` para no volver a copiarlo manualmente.

### Prompt 6 — Memoria entre sesiones
Pidió agregar "historial de prompts o algo que ayude a interpretar mejor próximas instrucciones en otras sesiones".

**Resultado:** Este archivo (`docs/prompts-history.md`) + `AGENTS.md` en raíz del repo. AGENTS.md = contexto, convenciones y reglas. prompts-history.md = narrativa cronológica de qué pidió y por qué se hizo cada cosa.

### Prompt 7 — Página de Settings
Pidió ocultar la sección de backup, que se despliegue bajo demanda en una nueva página llamada Settings, donde también esté el botón de "Borrar todo".

## 2026-06-13 — Protección contra borrado + Sync seguro

### Prompt 8 — Proteger sync contra push destructivo + app append-only
**Problema:** al abrir la app en un navegador vacío (o después de borrar datos) y presionar sync, el DB vacío sobreescribía el Gist y se propagaba a todos los dispositivos. 2-3 miembros de la banda usan la app.

**Decisiones del usuario:**
- **Nada se borra:** notas, attachments y canciones son append-only + editables. Borrar está prohibido en toda la UI.
- **"Borrar todo" se bloquea completamente** — ni siquiera localmente.
- **Owner = PIN:** un PIN/password que solo el admin conoce (hash SHA-256 almacenado en el Gist metadata).
- **Editar sí, borrar no:** campos, estados (checkboxes) y texto se pueden modificar.

**Resultado — 3 fases implementadas:**

**Fase 1 — Eliminar toda capacidad de borrado en la UI:**
- `RowNotesList.tsx`: removido botón ✕ que llamaba `deleteNote()`.
- `AttachmentsList.tsx`: removido botón ✕ que llamaba `deleteAttachment()`.
- `Settings.tsx`: eliminada sección completa "Zona peligrosa" + modal de confirmación + imports de `deleteAllData`, `useState`, `Modal`, `listSongs`.
- Funciones `deleteNote()`, `deleteAttachment()`, `deleteAllData()` se mantienen en `repository.ts` como infraestructura (sin UI que las invoque).

**Fase 2 — Sync seguro (guard de push destructivo):**
- `cloudSync.ts`: nuevo archivo `band-tool-meta.json` en el Gist con `{ song_count, pushed_at, device_id, admin_pin_hash }`.
- Cada push escribe DB blob + metadata. `getGistMeta()` ahora parsea metadata también.
- Guard en `doPush()`: si local tiene 0 canciones y remoto >0 → hace pull automático en vez de push.
- Guard en `checkAndPull()`: si local está vacío y remoto tiene datos → fuerza pull sin importar timestamps.
- `repository.ts`: nueva función `countSongs()` como helper para el guard.

**Fase 3 — PIN admin (infraestructura):**
- `cloudSync.ts`: funciones `setAdminPin()`, `verifyAdminPin()`, `hasAdminPin()` con hash SHA-256 almacenado en Gist metadata.
- `Settings.tsx`: nueva sección "PIN de administrador" para crear/cambiar PIN. Requiere PIN actual para cambiar.
- El PIN es infraestructura lista para proteger futuras acciones privilegiadas (ej: restaurar "Borrar todo" protegido).

**Archivos afectados:**
- `src/components/RowNotesList.tsx` — removido botón eliminar
- `src/components/AttachmentsList.tsx` — removido botón eliminar
- `src/routes/Settings.tsx` — removida zona peligrosa, agregada sección PIN admin
- `src/db/cloudSync.ts` — metadata en Gist, guard de push, funciones PIN
- `src/db/repository.ts` — agregado `countSongs()`

**Notas:** No se implementaron roles de usuario ni merge inteligente. Sigue siendo last-write-wins con protección contra DB vacío. Las funciones de borrado siguen en el código por si se necesitan para admin futuro protegido por PIN.

### Prompt 9 — Recuperación de datos + fix de bugs en sync
**Problema:** Al guardar el PIN admin, `setAdminPin()` patcheaba el Gist (solo metadata), lo cual cambiaba el `updated_at` del Gist. El auto-sync detectaba el cambio y disparaba un pull, descargando el DB blob del Gist (que ya estaba vacío de un push previo desde un browser vacío). Resultado: datos locales reemplazados con DB vacía.

**Bugs corregidos:**
1. `setAdminPin()`: ahora actualiza `LS_LAST_REMOTE_UPDATED` en localStorage después de patchear, para que auto-sync no re-haga pull por el cambio de `updated_at`.
2. `checkAndPull()`: nuevo guard — si local tiene canciones y remoto tiene 0, no hace pull (protege contra pull destructivo, simétrico al guard de push).

**Feature de recuperación:**
- `listGistRevisions()`: escanea las últimas 20 revisiones del Gist para encontrar cuáles tenían datos.
- `restoreFromRevision()`: restaura DB desde una revisión específica del Gist.
- `recoverLatestWithData()`: busca la revisión más reciente con `song_count > 0` y la restaura automáticamente. Luego hace push para que la versión recuperada sea la más reciente.
- UI: nueva sección "Recuperar datos" en Settings con botón "Restaurar última versión con datos".

**Archivos afectados:**
- `src/db/cloudSync.ts` — fix setAdminPin, guard pull, funciones de recovery
- `src/routes/Settings.tsx` — nueva sección RecoverySection

**Decisión / qué se hizo:**
- Nueva ruta `/settings` (`src/routes/Settings.tsx`) que contiene `ExportImportPanel`, `CloudSyncPanel` y un bloque "Zona peligrosa" con el botón "Borrar todo" + modal de confirmación reutilizando `Modal`.
- Home.tsx queda limpio: ya no renderiza `ExportImportPanel`, `CloudSyncPanel` ni "Borrar todo". En su lugar, un botón `⚙ Settings` (clase `ghost small`) abajo a la derecha que navega a `/settings` con `useNavigate`.
- Settings usa `FloatingHomeButton` para volver al inicio (mismo patrón que `Song`).
- Ruta registrada en `App.tsx` antes del catch-all.

**Archivos afectados:**
- `src/routes/Settings.tsx` (nuevo)
- `src/routes/Home.tsx` (limpieza + botón Settings)
- `src/App.tsx` (nueva ruta)

**Notas:** No se usó `<Link>` con clases de botón porque las clases `.primary/.ghost/.small/.danger` están scoped al selector `button` en `global.css`. Para evitar inconsistencias visuales se usa `<button onClick={() => nav('/settings')}>`.

---

## Cómo agregar entradas (para futuras sesiones / agentes)

Cuando el usuario pida algo nuevo:

1. Antes de empezar, leer este archivo + `AGENTS.md`.
2. Implementar el cambio.
3. Agregar entrada al final con la fecha de hoy, el prompt resumido, qué se decidió y por qué, y los archivos afectados.
4. Si se tomó una decisión de scope (qué se incluyó / excluyó), anotarlo en la sección de la entrada.
5. Si la decisión contradice algo de `AGENTS.md`, actualizar también `AGENTS.md`.

**No borrar entradas históricas** — son contexto valioso aunque la decisión haya cambiado después.
