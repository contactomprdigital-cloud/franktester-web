import { create } from 'zustand'
import type { Product } from '../data/types'

interface ProductModalState {
  selectedProduct: Product | null
  /** true cuando se abrió con "Testea tu suerte" (muestra la etiqueta "Tu fragancia de la suerte") */
  lucky: boolean
  /** Sube en cada apertura: la entrada se anima de nuevo aunque sea el mismo producto */
  seq: number
  open: (product: Product, lucky?: boolean) => void
  close: () => void
}

export const useProductModalStore = create<ProductModalState>((set) => ({
  selectedProduct: null,
  lucky: false,
  seq: 0,
  open: (product, lucky = false) => set((s) => ({ selectedProduct: product, lucky, seq: s.seq + 1 })),
  close: () => set({ selectedProduct: null }),
}))
