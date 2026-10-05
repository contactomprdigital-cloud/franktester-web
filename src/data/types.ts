export type Section = 'hombre' | 'mujer' | 'nicho' | 'ml50'

export type Badge = 'bestseller' | 'new' | null

export interface OlfactoryNotes {
  top: string[]
  heart: string[]
  base: string[]
}

export interface Product {
  id: string
  section: Section
  name: string
  inspiration: string
  price: number
  volume: string
  notes: OlfactoryNotes
  image: string
  badge: Badge
  stock: number
  /** Oculto en la tienda (el panel admin lo sigue mostrando) */
  hidden?: boolean
  /** Agregado desde el panel admin (no existe en PRODUCTS_SEED); solo estos se pueden eliminar */
  custom?: boolean
}

export interface Review {
  id: string
  name: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  section?: Section
}
