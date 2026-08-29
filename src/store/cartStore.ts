import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '../data/types'

export interface CartLine {
  id: string
  name: string
  price: number
  volume: string
  qty: number
}

interface CartState {
  lines: CartLine[]
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (product) =>
        set((state) => {
          const existing = state.lines.find((l) => l.id === product.id)
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.id === product.id ? { ...l, qty: l.qty + 1 } : l,
              ),
              isOpen: true,
            }
          }
          return {
            lines: [
              ...state.lines,
              {
                id: product.id,
                name: product.name,
                price: product.price,
                volume: product.volume,
                qty: 1,
              },
            ],
            isOpen: true,
          }
        }),
      removeItem: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      setQty: (id, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.id !== id)
              : state.lines.map((l) => (l.id === id ? { ...l, qty } : l)),
        })),
      clear: () => set({ lines: [] }),
      total: () => get().lines.reduce((sum, l) => sum + l.price * l.qty, 0),
      count: () => get().lines.reduce((sum, l) => sum + l.qty, 0),
    }),
    {
      name: 'franktester-cart',
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
)
