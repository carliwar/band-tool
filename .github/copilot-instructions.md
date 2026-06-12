# Copilot Instructions

Lee primero [AGENTS.md](../AGENTS.md) en la raíz del repo y [docs/prompts-history.md](../docs/prompts-history.md) para contexto completo del proyecto, convenciones y decisiones tomadas.

## Reglas mínimas

- Idioma con el usuario: **español**. Código: inglés.
- Mobile-first siempre (verificar a 375px).
- Toda mutación de datos va por `src/db/repository.ts` y termina con `notifyChange()`.
- Edición de canción fuera de sesión activa debe pasar por `useSessionGuard().guard(action)`.
- NO existe ni se agrega botón "Borrar todo".
- NO copiar `sql-wasm.wasm` a `public/` — se importa con `?url` y Vite lo bundlea.
- NO agregar dependencias UI (Tailwind/MUI/etc.).
- NO agregar tests automáticos sin pedirlo.
- Después de cualquier cambio significativo, agregar entrada a `docs/prompts-history.md`.
