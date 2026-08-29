import { useEffect } from 'react'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { PRODUCTS_SEED } from '../data/products'
import type { Product } from '../data/types'

type ProductRow = Omit<Product, 'image'>

interface CatalogState {
  products: Product[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>
  resetToSeed: () => Promise<void>
}

function mergeRow(seed: Product, row: ProductRow | undefined): Product {
  if (!row) return seed
  return { ...seed, ...row, image: seed.image }
}

export const useCatalogStore = create<CatalogState>()((set) => ({
  products: PRODUCTS_SEED,
  loading: true,
  error: null,
  fetchProducts: async () => {
    const { data, error } = await supabase.from('products').select('*')
    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    const byId = new Map((data ?? []).map((row) => [row.id as string, row as ProductRow]))
    set({
      products: PRODUCTS_SEED.map((seed) => mergeRow(seed, byId.get(seed.id))),
      loading: false,
      error: null,
    })
  },
  updateProduct: async (id, patch) => {
    const { name, price, stock, notes, badge } = patch
    const { error } = await supabase
      .from('products')
      .update({ name, price, stock, notes, badge, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      set({ error: error.message })
      throw new Error(error.message)
    }
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  },
  resetToSeed: async () => {
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

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const row = payload.new as ProductRow
          useCatalogStore.setState((state) => ({
            products: state.products.map((p) => (p.id === row.id ? mergeRow(p, row) : p)),
          }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchProducts])
}
