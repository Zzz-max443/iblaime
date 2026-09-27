// Mira central mínima. Placeholder de UI (sección 14/roadmap fase UI): esto
// no es un sistema de UI, es dos divs, pero le da al jugador feedback
// inmediato de hacia dónde apunta sin esperar a la interacción real.
export function createCrosshair(): void {
  const el = document.createElement('div');
  Object.assign(el.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    width: '18px',
    height: '18px',
    marginTop: '-9px',
    marginLeft: '-9px',
    pointerEvents: 'none',
    zIndex: '900',
  });
  const bar = (style: Partial<CSSStyleDeclaration>) => {
    const d = document.createElement('div');
    Object.assign(d.style, { position: 'absolute', background: 'rgba(255,255,255,0.85)' }, style);
    el.appendChild(d);
  };
  bar({ top: '8px', left: '0', width: '18px', height: '2px' });
  bar({ top: '0', left: '8px', width: '2px', height: '18px' });
  document.body.appendChild(el);
}
