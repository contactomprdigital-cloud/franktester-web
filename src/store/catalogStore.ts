import { useEffect } from 'react'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { PRODUCTS_SEED } from '../data/products'
import type { OlfactoryNotes, Product } from '../data/types'

type EditableFields = Pick<Product, 'name' | 'price' | 'stock' | 'notes' | 'badge'>

interface CatalogState {
  products: Product[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  updateProduct: (id: string, patch: Partial<EditableFields>) => Promise<void>
  resetToSeed: () => Promise<void>
}

const NOT_CONFIGURED = 'Supabase no está configurado'

const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max
const isCount = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max
const isNotes = (v: unknown): v is OlfactoryNotes =>
  typeof v === 'object' &&
  v !== null &&
  (['top', 'heart', 'base'] as const).every((k) => {
    const list = (v as Record<string, unknown>)[k]
    return Array.isArray(list) && list.length <= 20 && list.every((n) => isText(n, 40))
  })

// Una fila de la BD (o de Realtime) solo puede pisar los campos editables, y
// solo si tienen el tipo correcto: id, sección, inspiración, volumen e imagen
// salen siempre del código. Así una fila mal formada no puede tumbar la tienda
// para todos los visitantes.
function mergeRow(seed: Product, row: Record<string, unknown> | undefined): Product {
  if (!row) return seed
  return {
    ...seed,
    name: isText(row.name, 80) ? row.name.trim() : seed.name,
    price: isCount(row.price, 1_000_000) ? row.price : seed.price,
    stock: isCount(row.stock, 100_000) ? row.stock : seed.stock,
    notes: isNotes(row.notes) ? row.notes : seed.notes,
    badge: row.badge === 'bestseller' || row.badge === 'new' ? row.badge : null,
  }
}

export const useCatalogStore = create<CatalogState>()((set) => ({
  products: PRODUCTS_SEED,
  loading: supabase !== null,
  error: null,
  fetchProducts: async () => {
    if (!supabase) {
      set({ loading: false })
      return
    }
    const { data, error } = await supabase.from('products').select('*')
    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    const byId = new Map((data ?? []).map((row: Record<string, unknown>) => [String(row.id), row]))
    set({
      products: PRODUCTS_SEED.map((seed) => mergeRow(seed, byId.get(seed.id))),
      loading: false,
      error: null,
    })
  },
  updateProduct: async (id, patch) => {
    if (!supabase) throw new Error(NOT_CONFIGURED)
    // RLS no devuelve error cuando bloquea un UPDATE: simplemente no afecta
    // filas. Por eso se pide la fila actualizada y se exige que haya una.
    const { data, error } = await supabase
      .from('products')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
    if (error || !data || data.length !== 1) {
      const message = error?.message ?? 'No se guardó: permiso denegado o producto inexistente'
      set({ error: message })
      throw new Error(message)
    }
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  },
  resetToSeed: async () => {
    if (!supabase) throw new Error(NOT_CONFIGURED)
    const rows = PRODUCTS_SEED.map(({ image: _image, ...rest }) => rest)
    const { error } = await supabase.from('products').upsert(rows)
    if (error) {
      set({ error: error.message })
      throw new Error(error.message)
    }
    set({ products: PRODUCTS_SEED })
  },
}))

/** Loads the catalog once, then keeps every open tab/device in sync via Supabase Realtime. */
export function useCatalogSync() {
  const fetchProducts = useCatalogStore((s) => s.fetchProducts)

  useEffect(() => {
    fetchProducts()
    const client = supabase
    if (!client) return

    const channel = client
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          useCatalogStore.setState((state) => ({
            products: state.products.map((p) => (p.id === row.id ? mergeRow(p, row) : p)),
          }))
        },
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [fetchProducts])
}
