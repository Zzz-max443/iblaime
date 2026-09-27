# DECISIONS — por qué las cosas son como son

Formato: decisión → por qué → cuándo reconsiderar.

## Mesh: una malla por chunk, sin greedy meshing todavía

**Por qué:** correctness first. Face culling ya elimina la mayoría de los
triángulos innecesarios (caras internas). Greedy meshing suma complejidad
real (fusionar quads coplanares del mismo material) y solo vale la pena
medirlo contra un mundo con más chunks visibles a la vez.
**Reconsiderar cuándo:** el Profiler muestre triangle count o draw calls como
cuello de botella con un radio de mundo mayor al actual (26 bloques).

## AO: por vértice, con hasta 12 lookups extra de `World.getBlock` por cara

**Por qué:** técnica estándar de vóxeles (mirar los bloques "de borde" y "de
esquina" en la capa de aire justo delante de cada cara), barata en memoria,
no necesita shaders ni un pase extra de render — se hornea directo en el
color del vértice, que es lo que ya usa `MeshLambertMaterial` con
`vertexColors`. Se agregó junto con Player/Physics/Interaction en el mismo
ciclo (no estrictamente en el orden que sugería un plan de continuidad
anterior, que pedía posponerla) porque ya estaba implementada y verificada
matemáticamente antes de leer ese plan; se documenta acá para que quede
explícito, no escondido.
**Costo real:** NOT VERIFIED todavía — no se midió con el Profiler en un
mundo grande. Hay un `TODO(perf)` en `ChunkMesher.ts` con la salida obvia si
hace falta (buffer local con padding de 1 bloque en vez de golpear el `Map`
de chunks del `World` en cada lookup).
**Reconsiderar cuándo:** el Profiler muestre que remallar es lento.

## World: invalidación de vecinos cubre las 26 combinaciones (cara+arista+esquina), no solo las 6 de cara

**Por qué:** con face culling puro alcanzaba con los 6 vecinos de cara (cada
cara del cubo solo depende de un vecino). Al agregar AO por vértice, una cara
cerca del borde de un chunk puede leer bloques de un chunk **diagonal**
(arista o esquina), no solo del vecino de cara. Sin esto, un chunk nuevo que
aparece en diagonal a uno ya mallado podía dejar su AO desactualizado
silenciosamente. Verificado con un test de reproducción antes y después del
fix (ver `tests/smoke.ts`, `testNeighborInvalidation`).
**Nota:** un plan de continuidad anterior reportó como bug un caso distinto
(invalidación de vecino de *cara* al aparecer un chunk nuevo) — ese caso
específico se probó y **no reprodujo** con el código tal como estaba (test
también en `tests/smoke.ts`). Se dejó documentado en vez de "arreglar" algo
que no estaba roto, y se arregló el caso diagonal real que sí afecta al AO.

## ChunkMesher: winding de +X/-X corregido

**Por qué:** las 6 caras se verificaron con producto cruz (`cross(v1-v0,
v2-v0)` debe coincidir con la normal declarada). +X y -X tenían el orden de
vértices invertido — generaban geometría con normal geométrica opuesta a la
declarada. Estaba enmascarado porque `ChunkMeshManager` usa
`THREE.DoubleSide`. La iluminación no se veía afectada (usa el atributo
`normal` explícito, no el normal geométrico del triángulo), pero cualquier
optimización futura a `FrontSide` habría mostrado agujeros en esas dos caras.
**Reconsiderar cuándo:** alguien pueda verificar visualmente en navegador o
Android — recién ahí evaluar pasar de `DoubleSide` a `FrontSide` (básicamente
gratis: ~mitad de fragmentos por cara opaca).

## Physics: apoyo exacto en la superficie, no "cancelar todo el movimiento del frame"

**Por qué:** la primera versión, al detectar colisión cayendo, simplemente
ponía `velY=0` y descartaba el desplazamiento del frame entero. Con caídas
cortas no se nota, pero cayendo desde la torre (~22-24 bloques) el jugador
quedaba flotando más de medio bloque arriba del piso, bien visible. Ahora se
calcula la superficie sólida más alta dentro del recorrido y se apoya ahí
exacto. Es cálculo directo (no búsqueda binaria ni swept-AABB genérico):
aprovecha que los bloques viven en una grilla entera. VERIFIED con tests de
caída libre, salto, y caída desde la torre completa (los tres aterrizan
exacto en y=1, sin gap).
**Lo que sigue sin resolver:** golpe de cabeza contra el techo todavía
cancela el movimiento entero en vez de apoyar exacto (a propósito: la
velocidad de subida es mucho menor que la de una caída larga, el gap
resultante es imperceptible). Tampoco es swept-AABB continuo — con
velocidades mucho más altas que las de un jugador a pie podría haber
tunneling en paredes finas. `TODO` en el código.

## Raycast: DDA (Amanatides & Woo), no ray-marching a pasos fijos

**Por qué:** a corta distancia (alcance de 6 bloques) un ray-march con paso
fijo puede saltarse un bloque delgado si el paso es muy grande, o ser
carísimo si es muy chico. El DDA visita cada celda de la grilla exactamente
una vez, sin heurísticas de paso. NOT VERIFIED con direcciones casi
perfectamente axiales (dx/dy/dz muy cerca de 0 pero no exactamente 0) —
matemáticamente debería seguir andando (tDelta tiende a infinito, no da
división por cero real), pero no se armó un test específico para ese borde.

## DebugCameraController: se deja en el árbol, sin usar en `main.ts`

**Por qué:** el propio comentario del archivo decía que se iba a descartar
al implementar Player + Physics — se cumplió esa intención en este ciclo.
Se conserva el archivo (no se borra) porque puede reaproximarse fácil a un
modo espectador/debug real más adelante (cámara libre sin colisión, útil
para depurar generación de mundo o mods). Si en 2-3 ciclos nadie lo retoma,
borrarlo.

## Tests sin framework (`tests/smoke.ts`, corridos con `tsx`)

**Por qué:** no hay `node_modules` instalables en algunos entornos de
desarrollo (sin red). Un test runner (`vitest`, `jest`) es una dependencia
más que puede no estar disponible offline. `tsx` sí está disponible en este
entorno como herramienta global, y los tests son lógica pura (no necesitan
JSDOM ni WebGL), así que un script con `assert()` y `process.exit(1)` en caso
de fallo alcanza.
**Reconsiderar cuándo:** el proyecto tenga red consistente y la cantidad de
tests justifique un runner real (reporting más lindo, watch mode, etc.).
