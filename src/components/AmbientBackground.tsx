import type { Section } from '../data/types'

export type AmbientTint = 'top' | Section

/**
 * Fondo fijo de toda la página: textura de tréboles y grano (estáticos) más un
 * tinte suave por colección que solo hace un fundido al cambiar de sección.
 * Reemplaza a ScrollBackground, que animaba 5 capas a pantalla completa con
 * resortes en cada frame de scroll.
 */
export function AmbientBackground({ tint }: { tint: AmbientTint }) {
  return (
    <div className="ambient pointer-events-none fixed inset-0 -z-10" data-tint={tint} aria-hidden="true">
      <div className="amb-base" />
      <div className="amb-tint amb-hombre" />
      <div className="amb-tint amb-mujer" />
      <div className="amb-tint amb-nicho" />
      <div className="amb-clover" />
      <div className="amb-grain" />
    </div>
  )
}
