# ROADMAP — estado real

Última actualización: sesión del 2026-09-27 (ver `.ai/sessions/2026-09-27.md`).

No confundir "pendiente" con "no importa" — es solo el orden. No confundir
"parcial" con "roto" — significa que la base está bien pero le falta
profundidad (texturas reales, greedy meshing, etc.), no que tenga bugs
conocidos sin corregir.

| Fase | Estado | Notas |
|---|---|---|
| FOUNDATION | done | |
| ENGINE | done | Clock, Engine (rAF + pausa por visibilitychange) |
| WORLD | done | coords, chunks 16³, Uint16Array, dirty flags, invalidación de vecinos (cara + arista/esquina) |
| BLOCKS | done | air/stone/dirt/grass/wood/leaves, colores placeholder |
| CHUNKS | done | |
| MESHING | parcial | face culling + AO por vértice + jitter procedural. Falta: greedy meshing, Workers, LOD |
| RENDERER | parcial | ACES tone mapping, sombras PCF, fog, skydome con gradiente, DoubleSide temporal (candidato a FrontSide, ver DECISIONS) |
| LIGHTING | parcial | sun + hemisphere light + sombras + AO por vértice. Falta: bounce light, GI aproximada |
| PLAYER | done (base) | posición/velocidad, cámara vinculada, movimiento horizontal, gravedad, salto — VERIFIED por test de física, NOT VERIFIED en navegador/Android |
| PHYSICS | done (base) | AABB vs vóxel, colisión por eje, apoyo exacto sin gap (ver DECISIONS) — VERIFIED por tests |
| INTERACTION | done (base) | raycast DDA, romper/poner bloque, actualiza World y dispara remallado — VERIFIED por tests, NOT VERIFIED en navegador |
| UI | pendiente salvo crosshair + botones táctiles placeholder | |
| EXTENSION API | pendiente | |
| SCRIPT EXECUTOR | pendiente | |
| INTEGRATION | pendiente | |
| PERFORMANCE | pendiente | nada medido en dispositivo real todavía |
| VISUAL POLISH | pendiente | |
| ASSETS | pendiente | sigue todo con colores planos, sin atlas de texturas |
| AUDIO | pendiente | |
| CONTENT | pendiente | |
| MULTIPLAYER | pendiente | |

## Qué NO son bugs (para no confundir en el próximo ciclo)

Faltar esto no es un bug, es roadmap pendiente: greedy meshing, Workers, LOD,
atlas/texturas finales, agua, vegetación, audio, UI completa, mods, Script
Executor, multiplayer, colores placeholder, DoubleSide temporal.
