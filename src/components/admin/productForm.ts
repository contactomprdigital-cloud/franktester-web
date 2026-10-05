import type { OlfactoryNotes } from '../../data/types'
import { ImageError } from '../../lib/image'
import { CatalogError, FIELD_MESSAGES, LIMITS } from '../../store/catalogStore'

/** Campos de texto de los formularios del panel (todos como string, tal cual los escribe el admin) */
export interface FormValues {
  name: string
  inspiration: string
  volume: string
  price: string
  stock: string
  top: string
  heart: string
  base: string
}

export type FormField = keyof FormValues | 'section' | 'badge' | 'image'

export interface FormProblem {
  field?: FormField
  message: string
}

export const toText = (list: string[]) => list.join(', ')

export const fromText = (text: string) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export const notesFromValues = (v: Pick<FormValues, 'top' | 'heart' | 'base'>): OlfactoryNotes => ({
  top: fromText(v.top),
  heart: fromText(v.heart),
  base: fromText(v.base),
})

/** Entero en rango. Acepta "6000" y también "6.000" (separador de miles). */
export function parseInteger(text: string, min: number, max: number): number | null {
  let s = text.trim()
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  if (!/^\d{1,7}$/.test(s)) return null
  const n = Number(s)
  return n >= min && n <= max ? n : null
}

export const parsePrice = (text: string) => parseInteger(text, LIMITS.priceMin, LIMITS.priceMax)
export const parseStock = (text: string) => parseInteger(text, 0, LIMITS.stockMax)

const textOk = (text: string, max: number) => {
  const t = text.trim()
  return t.length >= 1 && t.length <= max
}

/**
 * Valida solo los campos presentes (la fila de un producto no tiene todos).
 * Mismas reglas que la BD; devuelve el primer problema con su campo.
 */
export function validateForm(v: Partial<FormValues>): FormProblem | null {
  if (v.name !== undefined && !textOk(v.name, LIMITS.name)) return { field: 'name', message: FIELD_MESSAGES.name }
  if (v.inspiration !== undefined && !textOk(v.inspiration, LIMITS.inspiration))
    return { field: 'inspiration', message: FIELD_MESSAGES.inspiration }
  if (v.volume !== undefined && !textOk(v.volume, LIMITS.volume)) return { field: 'volume', message: FIELD_MESSAGES.volume }
  if (v.price !== undefined && parsePrice(v.price) === null) return { field: 'price', message: FIELD_MESSAGES.price }
  if (v.stock !== undefined && parseStock(v.stock) === null) return { field: 'stock', message: FIELD_MESSAGES.stock }
  for (const key of ['top', 'heart', 'base'] as const) {
    const text = v[key]
    if (text === undefined) continue
    const list = fromText(text)
    if (list.length > LIMITS.notesPerGroup || list.some((n) => n.length > LIMITS.noteLength))
      return { field: key, message: FIELD_MESSAGES.notes }
  }
  return null
}

/** Mensaje de un error del store (ya viene en español); cualquier otro error, el texto genérico */
export const errorMessage = (e: unknown, fallback: string) =>
  (e instanceof CatalogError || e instanceof ImageError) && e.message ? e.message : fallback

export const BADGE_OPTIONS = [
  { value: '', label: 'Sin etiqueta' },
  { value: 'bestseller', label: 'Más vendido' },
  { value: 'new', label: 'Nuevo' },
] as const
