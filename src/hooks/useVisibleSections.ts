import { useMemo } from 'react'
import { SECTIONS, type SectionInfo } from '../data/sections'
import { useCatalogStore } from '../store/catalogStore'

/**
 * Categorías que se muestran en la tienda: las de SECTIONS con al menos un
 * producto visible, en el mismo orden. Así "50 ml" aparece sola con su primer perfume.
 */
export function useVisibleSections(): readonly SectionInfo[] {
  const products = useCatalogStore((s) => s.products)
  return useMemo(() => SECTIONS.filter((section) => products.some((p) => p.section === section.id)), [products])
}

/** Texto para pestañas y botones del hero, donde el espacio es justo: "Nicho / Unisex" → "Nicho". */
export const shortLabel = (section: SectionInfo) => section.label.split(' / ')[0]
