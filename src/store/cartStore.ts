import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '../data/types'
import { useCatalogStore } from './catalogStore'
import { useToastStore } from './toastStore'

/** Lo único que se guarda de cada línea: nombre, precio, volumen e imagen salen siempre del catálogo. */
export interface CartLine {
  id: string
  qty: number
}

/** Máximo por producto en un pedido (además del stock) */
export const MAX_QTY = 20
/** Tope de lo que se acepta al leer el almacenamiento */
const STORED_QTY_MAX = 99
const ID_PATTERN = /^[a-z0-9-]{1,60}$/

/** Cantidad máxima de un producto: el menor entre el stock y MAX_QTY (0 = no se puede agregar). */
export const maxQty = (stock: number) => (Number.isInteger(stock) && stock > 0 ? Math.min(stock, MAX_QTY) : 0)

// ---------------------------------------------------------------------------
// Lectura segura del almacenamiento: un valor mal formado deja el carrito vacío, nunca rompe la página.
// ---------------------------------------------------------------------------

/**
 * Valida las líneas guardadas. Debe ser un arreglo de `{ id, qty }` con id válido,
 * sin repetidos, y qty entera de 1 a 99; si algo no cuadra, todo el carrito se descarta.
 * Cualquier otro campo (nombre, precio...) se ignora: solo se conservan id y qty.
 */
export function readLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const lines: CartLine[] = []
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return []
    const { id, qty } = item as Record<string, unknown>
    if (typeof id !== 'string' || !ID_PATTERN.test(id) || seen.has(id)) return []
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > STORED_QTY_MAX) return []
    seen.add(id)
    lines.push({ id, qty })
  }
  return lines
}

const storedLines = (persisted: unknown): unknown =>
  typeof persisted === 'object' && persisted !== null ? (persisted as { lines?: unknown }).lines : undefined

/**
 * Pasa de un formato guardado anterior al actual. La versión 0 guardaba también
 * nombre, precio y volumen de cada línea: se conserva solo id y cantidad.
 */
export function migrateCart(persisted: unknown): { lines: CartLine[] } {
  return { lines: readLines(storedLines(persisted)) }
}

// ---------------------------------------------------------------------------
// Líneas resueltas contra el catálogo
// ---------------------------------------------------------------------------

export interface CartEntry extends CartLine {
  /** null = ya no está en la tienda (oculto, eliminado o desconocido) */
  product: Product | null
  /** Máximo permitido hoy según el stock (0 = agotado o ya no disponible) */
  max: number
}
export type AvailableEntry = CartEntry & { product: Product }

export const isAvailable = (entry: CartEntry): entry is AvailableEntry => entry.product !== null && entry.max > 0

/** Cruza las líneas guardadas con el catálogo; la cantidad nunca pasa del límite actual. */
export function resolveCart(lines: readonly CartLine[], products: readonly Product[]): CartEntry[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  return lines.map(({ id, qty }) => {
    const product = byId.get(id) ?? null
    const max = product ? maxQty(product.stock) : 0
    return { id, qty: max > 0 ? Math.min(qty, max) : qty, product, max }
  })
}

const available = (entries: readonly CartEntry[]) => entries.filter(isAvailable)

/** Total de las líneas disponibles, con los precios del catálogo */
export const cartTotal = (entries: readonly CartEntry[]) =>
  available(entries).reduce((sum, e) => sum + e.product.price * e.qty, 0)

/** Unidades disponibles en el carrito */
export const cartCount = (entries: readonly CartEntry[]) => available(entries).reduce((sum, e) => sum + e.qty, 0)

const entriesNow = (lines: readonly CartLine[]) => resolveCart(lines, useCatalogStore.getState().products)

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface CartState {
  lines: CartLine[]
  isOpen: boolean
  /** Sube cuando cambia el catálogo, para que quien lee total() o count() se actualice (no se guarda) */
  rev: number
  open: () => void
  close: () => void
  toggle: () => void
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  /** Ajusta las cantidades al stock actual del catálogo */
  reconcile: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      rev: 0,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (product) => {
        // Se usa el producto vivo del catálogo: la ficha abierta puede tener un stock desactualizado
        const live = useCatalogStore.getState().products.find((p) => p.id === product.id)
        const max = live ? maxQty(live.stock) : 0
        if (!live || max < 1 || !ID_PATTERN.test(live.id)) {
          useToastStore.getState().show(`${product.name} ya no está disponible`, true)
          return
        }
        const existing = get().lines.find((l) => l.id === live.id)
        if (existing && existing.qty >= max) {
          useToastStore
            .getState()
            .show(max < MAX_QTY ? `Solo hay ${max} de ${live.name}` : `Máximo ${MAX_QTY} de ${live.name} por pedido`, true)
          return
        }
        set((state) => ({
          lines: existing
            ? state.lines.map((l) => (l.id === live.id ? { ...l, qty: l.qty + 1 } : l))
            : [...state.lines, { id: live.id, qty: 1 }],
        }))
      },
      removeItem: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),
      setQty: (id, qty) =>
        set((state) => {
          if (!Number.isInteger(qty)) return state
          if (qty <= 0) return { lines: state.lines.filter((l) => l.id !== id) }
          const entry = entriesNow(state.lines).find((e) => e.id === id)
          // Sin producto en el catálogo (o agotado) no hay cantidad que subir: solo se puede quitar
          if (!entry || entry.max < 1) return state
          const next = Math.min(qty, entry.max)
          return { lines: state.lines.map((l) => (l.id === id ? { ...l, qty: next } : l)) }
        }),
      clear: () => set({ lines: [] }),
      reconcile: () => {
        // Mientras carga, el catálogo solo trae los productos del código: no se toca nada
        if (useCatalogStore.getState().loading) return
        set((state) => {
          const entries = entriesNow(state.lines)
          // Producto desconocido o agotado: la línea se queda tal cual (vuelve si el producto vuelve)
          const lines = state.lines.map((l, i) => (entries[i].max > 0 && entries[i].qty < l.qty ? { ...l, qty: entries[i].qty } : l))
          return { lines: lines.some((l, i) => l !== state.lines[i]) ? lines : state.lines, rev: state.rev + 1 }
        })
      },
      total: () => cartTotal(entriesNow(get().lines)),
      count: () => cartCount(entriesNow(get().lines)),
    }),
    {
      name: 'franktester-cart',
      version: 1,
      partialize: (state) => ({ lines: state.lines }),
      migrate: migrateCart,
      // Siempre se valida lo leído, aunque la versión coincida (el almacenamiento lo puede editar cualquiera)
      merge: (persisted, current) => ({ ...current, lines: readLines(storedLines(persisted)) }),
    },
  ),
)

// Cuando el catálogo cambia (stock, productos ocultos, carga lista) se ajusta el carrito
useCatalogStore.subscribe((state, prev) => {
  if (state.products !== prev.products || state.loading !== prev.loading) useCartStore.getState().reconcile()
})
useCartStore.getState().reconcile()
