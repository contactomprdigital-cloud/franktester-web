import { SECTIONS } from '../data/sections'
import type { Section } from '../data/types'

/**
 * Fondo fijo de toda la página: textura de tréboles y grano (estáticos) más un
 * tinte suave por colección (colores en index.css, `.amb-tint[data-s]`) que solo
 * hace un fundido al cambiar de sección. `null` = portada, sin tinte.
 */
export function AmbientBackground({ tint }: { tint: Section | null }) {
  return (
    <div className="ambient pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div className="amb-base" />
      {SECTIONS.map((section) => (
        <div key={section.id} data-s={section.id} className={`amb-tint ${tint === section.id ? 'on' : ''}`} />
      ))}
      <div className="amb-clover" />
      <div className="amb-grain" />
    </div>
  )
}
