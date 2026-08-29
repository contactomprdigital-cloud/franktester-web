import { create } from 'zustand'
import type { Product } from '../data/types'

interface ProductModalState {
  selectedProduct: Product | null
  open: (product: Product) => void
  close: () => void
}

export const useProductModalStore = create<ProductModalState>((set) => ({
  selectedProduct: null,
  open: (product) => set({ selectedProduct: product }),
  close: () => set({ selectedProduct: null }),
}))
