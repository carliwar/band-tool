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

---

## Cómo agregar entradas (para futuras sesiones / agentes)

Cuando el usuario pida algo nuevo:

1. Antes de empezar, leer este archivo + `AGENTS.md`.
2. Implementar el cambio.
3. Agregar entrada al final con la fecha de hoy, el prompt resumido, qué se decidió y por qué, y los archivos afectados.
4. Si se tomó una decisión de scope (qué se incluyó / excluyó), anotarlo en la sección de la entrada.
5. Si la decisión contradice algo de `AGENTS.md`, actualizar también `AGENTS.md`.

**No borrar entradas históricas** — son contexto valioso aunque la decisión haya cambiado después.
