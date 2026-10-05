import type { Section } from './types'

export interface SectionInfo {
  id: Section
  /** Texto corto para pestañas, filtros y botones */
  label: string
  /** Título grande de la sección en la tienda */
  title: string
  /** Volumen sugerido al agregar un perfume nuevo en esta categoría */
  defaultVolume: string
}

// Única fuente de verdad de las categorías. La tienda solo muestra las que
// tienen al menos un producto visible, así "50 ml" aparece sola cuando se
// cargue el primer perfume de ese formato.
export const SECTIONS: readonly SectionInfo[] = [
  { id: 'hombre', label: 'Hombre', title: 'Hombre', defaultVolume: '30 ml' },
  { id: 'mujer', label: 'Mujer', title: 'Mujer', defaultVolume: '30 ml' },
  { id: 'nicho', label: 'Nicho / Unisex', title: 'Nicho · Unisex', defaultVolume: '30 ml' },
  { id: 'ml50', label: '50 ml', title: '50 ml', defaultVolume: '50 ml' },
]

export const SECTION_IDS: readonly Section[] = SECTIONS.map((s) => s.id)

export const isSection = (v: unknown): v is Section => SECTION_IDS.includes(v as Section)

export const sectionInfo = (id: Section): SectionInfo => SECTIONS.find((s) => s.id === id) ?? SECTIONS[0]
