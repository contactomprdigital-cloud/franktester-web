export type Section = 'hombre' | 'mujer' | 'nicho'

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
}

export interface Review {
  id: string
  name: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  section?: Section
}
