# Band Tool

SPA mobile-first para gestionar maquetas de canciones de la banda: cronograma de sesión, notas por fase, archivos y links, multi-sesión con cronómetro. Local-first con SQLite (sql.js) en el browser. Export/import `.sqlite` y `.json`.

Estilo visual: Kerrang + metal moderno (Sleep Token / BMTH / Bad Omens).

## Stack
- React 19 + Vite + TypeScript
- React Router
- sql.js (SQLite en wasm) + idb-keyval (persistencia local)
- CSS Modules + variables CSS, sin frameworks de UI

## Desarrollo

Requiere Node 20+ (`nvm use 20`).

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173/band-tool/`.

## Build producción

```bash
npm run build
# sirve dist/ con cualquier static server:
npx serve dist
```

## Despliegue

GitHub Pages + GitHub Actions. Push a `main` → workflow `.github/workflows/deploy.yml` corre y publica.

Una vez:
1. Crear repo en GitHub.
2. `git remote add origin <url>` y `git push -u origin main`.
3. GitHub → Settings → Pages → Source: **GitHub Actions**.

URL final: `https://<user>.github.io/band-tool/`.

> Si vas a usar un nombre distinto a `band-tool`, actualizá `base` en `vite.config.ts`.

## Features

- **Mobile-first**, touch targets >= 44px, sin scroll horizontal a 375px.
- **Cronograma** preconfigurado (9 fases, sin pausas — la banda decide), checkboxes con timestamp.
- **Modal de fila** con detalle, notas (lista) y reglas fijas debajo.
- **Multi-sesión** por canción. Cronómetro en vivo + total acumulado. Botón "Historial" con fecha (`dd/mes/yyyy`) y duración (`Xh Ym`).
- **Edición con guard de sesión**: editar fuera de sesión activa pide confirmar iniciar una nueva.
- **Archivos y links** por canción (archivos guardados como BLOB).
- **Auto-save** con debounce 300ms a IndexedDB. No hay botón de guardar.
- **Export/Import** `.sqlite` y `.json`. Backups portables entre máquinas.
- **NO** hay botón "Borrar todo".
