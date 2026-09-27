# HANDOFF — leer esto primero al empezar el próximo ciclo

## Estado en una frase

Los sistemas base (World/Chunks/Meshing/Renderer) están sólidos y con dos
bugs reales corregidos; encima de eso ya hay Player + Physics + Interacción
básica funcionando y probada a nivel lógico. Nada de esto se vio todavía en
un navegador ni en Android real.

## Cómo dejarlo corriendo (para quien tenga navegador/red)

```
npm install        # necesita red (three, vite, @types/three)
npm run dev         # abre el juego de verdad en el navegador
```

Sin red, para seguir trabajando en la lógica:
```
npm run typecheck:offline   # type-check sin necesitar 'three' instalado
npm run verify               # tests de humo (World/Physics/Raycast/Mesher)
```

## Lo que se hizo este ciclo (2026-09-27)

- Se encontró y corrigió un bug real de winding en +X/-X del `ChunkMesher`
  (verificado con producto cruz, no solo "se ve bien").
- Se revisó el reporte de un bug de invalidación de vecinos en `World.ts`;
  ese caso puntual **no reprodujo** (hay test que lo prueba), pero se
  encontró y corrigió uno relacionado y real: la invalidación no cubría
  vecinos diagonales, necesarios desde que el mesher usa AO por vértice.
- Se agregó AO por vértice al mesher (mejora visual, no estaba pedida como
  bug, ver `.ai/DECISIONS.md` para el porqué de hacerla en este ciclo).
- Se implementó Player real (posición, gravedad, salto, colisión AABB contra
  el mundo) reemplazando al `DebugCameraController` en el loop principal.
- Se implementó interacción: raycast DDA + romper/poner bloques. Se encontró
  y corrigió un bug propio de esta sesión (celda de colocación con signo
  invertido).
- Se agregó `tests/smoke.ts` con 4 tests de lógica pura, todos en verde.
- Se escribió esta documentación (`AGENTS.md`, `.ai/*`).

## Qué NO se hizo (y por qué no se inventó que sí)

- **Nada se vio en un navegador ni en Android.** Este entorno no tiene
  acceso a WebGL ni red para instalar `three`/`vite` reales. Todo lo
  "VERIFIED" en este ciclo es verificación matemática o de lógica pura
  (tests en Node), no visual.
- No se tocó `DoubleSide` → `FrontSide` en el material de chunks, aunque el
  winding ya está corregido para permitirlo — falta confirmación visual
  primero (ver `.ai/DECISIONS.md`).
- No se implementó greedy meshing, Workers, LOD, ni atlas de texturas — no
  eran bugs, son roadmap pendiente (ver `.ai/ROADMAP.md`).
- No se agregó hotbar/selección de bloque real: colocar siempre pone stone
  (`PLACE_BLOCK_ID` hardcodeado en `InteractionController.ts`, marcado
  `TODO(UI)`).

## Próximo paso lógico

1. **Si hay entorno con navegador:** `npm install && npm run dev`, y recién
   ahí clasificar como VERIFIED (o no) todo lo que hoy dice NOT VERIFIED:
   winding de las 6 caras a simple vista, AO visualmente, Player/cámara,
   romper/poner bloques, HUD del Profiler.
2. Con eso confirmado, evaluar `FrontSide` en el material de chunks.
3. Seguir con Fase D completa de interacción (feedback visual de qué bloque
   está seleccionado — ahora mismo rompe/coloca sin resaltar nada primero) y
   después recién considerar generación procedural / streaming, según decía
   el roadmap original.

## Regla para quien siga

No reinicies esto. No lo reemplaces por un prototipo nuevo. Si algo del
código existente parece raro, hay un test o una entrada en `DECISIONS.md`
que probablemente explique por qué — leelos antes de reescribir.
