import { create } from 'zustand'
import type { Product } from '../data/types'

interface ProductModalState {
  selectedProduct: Product | null
  /** true cuando se abrió con "Testea tu suerte" (muestra la etiqueta "Tu fragancia de la suerte") */
  lucky: boolean
  open: (product: Product, lucky?: boolean) => void
  close: () => void
}

export const useProductModalStore = create<ProductModalState>((set) => ({
  selectedProduct: null,
  lucky: false,
  open: (product, lucky = false) => set({ selectedProduct: product, lucky }),
  close: () => set({ selectedProduct: null }),
}))
