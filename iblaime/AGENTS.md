# AGENTS.md — IBLAIME

Este archivo es para cualquier agente (humano o IA) que continúe este proyecto.
Leelo antes de tocar código. Después leé `.ai/HANDOFF.md` para el estado real
del último ciclo de trabajo.

## Qué es esto

Un juego voxel estilizado, con dirección artística cuidada, prioridad Android,
en TypeScript + Three.js + Vite. No es un clon de Minecraft ni una demo
técnica: cada sistema se piensa desde geometría, materiales, iluminación,
percepción, composición, atmósfera, animación, sonido, rendimiento y
escalabilidad a la vez (ver el brief original si existe en el repo/histórico
de conversación — no se repite acá para no duplicarlo).

## Reglas que no se negocian

1. **World es la fuente de verdad. Renderer solo representa.** Nada en
   `engine/render/` decide qué existe en el mundo; solo lee `World` y dibuja.
2. **No inventar resultados.** Si algo no se probó, se marca `NOT VERIFIED` o
   `REQUIRES ANDROID TEST` en el código y en `.ai/`. Nunca se afirma "esto
   debería andar bien en Android" sin haberlo probado en Android real.
3. **No inventar problemas tampoco.** Si un reporte de bug no se puede
   reproducir con un test concreto, no se "arregla" a ciegas — se documenta
   por qué no reprodujo y se sigue. `tests/smoke.ts` tiene ejemplos de cómo
   reproducir antes de tocar código.
4. **Correctness first, después perf.** No optimizar sin medir con
   `Profiler`. Los `TODO(perf)` en el código son intencionales: quedan ahí
   hasta que el profiler diga que hacen falta.
5. **No agregar dependencias grandes sin necesidad.** El stack es
   deliberadamente chico (three, vite, typescript). Cualquier librería nueva
   necesita justificarse.
6. **No refactorizar en masa sin necesidad.** Cambios grandes solo si hay una
   razón concreta (bug real, o el roadmap lo pide).
7. **Comentarios en español**, mismo tono que el resto del código: explican
   el *por qué*, no el *qué* (el código ya dice el qué). Etiquetas que se usan
   en todo el repo: `NOT VERIFIED`, `REQUIRES ANDROID TEST`, `TODO(perf)`,
   `TODO(UI)`, `VERIFIED`.

## Cómo se trabaja acá (sin red)

Este entorno de desarrollo puede no tener acceso a red. Por eso:

- `tsconfig.offline.json` extiende a `tsconfig.json` pero desactiva `types`
  para no depender de `@types/three` si no está instalado. `shims/three_d.ts`
  declara un `THREE` mínimo (`any` por dentro) solo para que el type-checker
  no se rompa — **nunca** confiar en la forma real de la API a partir de ese
  shim, es un placeholder de tipos, no la librería real.
- `npm run typecheck:offline` corre sin necesitar `node_modules/three`.
- `npm run verify` corre `tests/smoke.ts` con `tsx` — son tests de lógica
  pura (World, Physics, Raycast, Mesher) que NO necesitan WebGL ni un
  navegador, así que sí corren en este entorno.
- Lo que SÍ necesita navegador o Android real (ver visualmente el resultado,
  medir FPS reales, probar input táctil) queda marcado `NOT VERIFIED` o
  `REQUIRES ANDROID TEST` hasta que alguien con esos entornos lo confirme.

## Estructura

```
src/
  engine/   — no sabe nada de gameplay. Core, Math, World, Render, Physics,
              Input, Interaction (capacidades genéricas), Profiling, UI.
  game/     — sabe de gameplay. Player, Gameplay (reglas de romper/poner,
              etc.), World (generación específica de este juego).
tests/      — tests de humo sin framework (ver .ai/DECISIONS.md por qué).
.ai/        — documentación viva: ROADMAP, DECISIONS, CURRENT_TASK, HANDOFF,
              sessions/ (un archivo por ciclo de trabajo).
```

## Antes de terminar un ciclo de trabajo

1. `npm run typecheck:offline` (o `typecheck` si hay red) sin errores.
2. `npm run verify` sin fallos.
3. Actualizar `.ai/ROADMAP.md`, `.ai/HANDOFF.md` y agregar una entrada en
   `.ai/sessions/` con fecha. No dejar el estado documentado desactualizado
   respecto al código real — es peor que no documentar nada.
