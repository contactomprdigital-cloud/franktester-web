import { useEffect } from 'react'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import {
  checkImageFile,
  ImageError,
  isProductImageUrl,
  removeProductFolder,
  removeProductImages,
  storagePathFromUrl,
  uploadProductImage,
} from '../lib/image'
import { PRODUCTS_SEED } from '../data/products'
import { isSection } from '../data/sections'
import type { Badge, OlfactoryNotes, Product } from '../data/types'

/** Fila de `public.products` tal como llega de la BD o de Realtime (sin validar) */
type Row = Record<string, unknown>

/** Límites de cada campo: son los mismos CHECK de la migración de Supabase. */
export const LIMITS = {
  name: 80,
  inspiration: 80,
  volume: 20,
  priceMin: 1,
  priceMax: 1_000_000,
  stockMax: 100_000,
  notesPerGroup: 20,
  noteLength: 40,
} as const

/** Mensajes de validación, compartidos con los formularios del panel */
export const FIELD_MESSAGES = {
  name: 'El nombre debe tener entre 1 y 80 caracteres.',
  inspiration: 'Indica en qué perfume se inspira (hasta 80 caracteres).',
  volume: 'Indica el volumen, por ejemplo "30 ml" (hasta 20 caracteres).',
  price: 'Precio inválido: usa solo números enteros entre 1 y 1.000.000 (ej. 6000).',
  stock: 'Stock inválido: usa un número entero entre 0 y 100.000.',
  notes: 'Cada grupo de notas admite hasta 20 notas de hasta 40 caracteres.',
  badge: 'Elige una etiqueta válida.',
  section: 'Elige una categoría válida.',
  hidden: 'Valor inválido para "oculto".',
} as const

type BaseField = 'name' | 'price' | 'stock' | 'notes' | 'badge' | 'hidden'
type CustomOnlyField = 'inspiration' | 'volume' | 'section'
/** Campos editables: los base en cualquier producto; inspiración, volumen y categoría solo en los agregados a mano */
export type ProductPatch = Partial<Pick<Product, BaseField | CustomOnlyField>>
export type NewProductInput = Pick<
  Product,
  'section' | 'name' | 'inspiration' | 'volume' | 'price' | 'stock' | 'notes' | 'badge'
>

const BASE_FIELDS: readonly string[] = ['name', 'price', 'stock', 'notes', 'badge', 'hidden'] satisfies BaseField[]
const CUSTOM_ONLY_FIELDS: readonly string[] = ['inspiration', 'volume', 'section'] satisfies CustomOnlyField[]

/** Error con un mensaje listo para mostrar en el panel */
export class CatalogError extends Error {
  name = 'CatalogError'
}

const NOT_CONFIGURED = 'Supabase no está configurado.'
const ZERO_ROWS = 'No se guardó: tu cuenta no tiene permisos o el producto ya no existe. Recarga la página.'
const ID_PATTERN = /^[a-z0-9-]{1,60}$/
const SEED_BY_ID = new Map(PRODUCTS_SEED.map((p) => [p.id, p]))

// ---------------------------------------------------------------------------
// Validación de filas: una fila mal formada no puede tumbar la tienda.
// ---------------------------------------------------------------------------

const isText = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max

/** Entero en rango. PostgREST devuelve `numeric` como string ("8000"): también se acepta. */
const toCount = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d{1,7}$/.test(v) ? Number(v) : Number.NaN
  return Number.isInteger(n) && n >= min && n <= max ? n : null
}

const isNotes = (v: unknown): v is OlfactoryNotes =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  (['top', 'heart', 'base'] as const).every((k) => {
    const list = (v as Row)[k]
    return (
      Array.isArray(list) &&
      list.length <= LIMITS.notesPerGroup &&
      list.every((n) => isText(n, LIMITS.noteLength))
    )
  })

/** Copia solo top/heart/base, sin espacios sobrantes */
const cleanNotes = (n: OlfactoryNotes): OlfactoryNotes => ({
  top: n.top.map((s) => s.trim()),
  heart: n.heart.map((s) => s.trim()),
  base: n.base.map((s) => s.trim()),
})

/** null/ausente = sin etiqueta; undefined = valor inválido */
const toBadge = (v: unknown): Badge | undefined =>
  v === null || v === undefined ? null : v === 'bestseller' || v === 'new' ? v : undefined

/**
 * Producto del catálogo base + su fila de la BD. La fila solo pisa los campos
 * editables, y solo si tienen el tipo correcto; id, sección, inspiración y
 * volumen salen siempre del código. La foto de la BD se usa solo si es de
 * nuestro bucket.
 */
export function mergeRow(seed: Product, row: Row | undefined): Product {
  if (!row) return seed
  const price = toCount(row.price, LIMITS.priceMin, LIMITS.priceMax)
  const stock = toCount(row.stock, 0, LIMITS.stockMax)
  return {
    ...seed,
    name: isText(row.name, LIMITS.name) ? row.name.trim() : seed.name,
    price: price ?? seed.price,
    stock: stock ?? seed.stock,
    notes: isNotes(row.notes) ? cleanNotes(row.notes) : seed.notes,
    badge: toBadge(row.badge) ?? null,
    image: isProductImageUrl(row.image_url) ? row.image_url : seed.image,
    hidden: row.hidden === true,
  }
}

/**
 * Producto agregado desde el panel (no existe en el código). Se valida todo;
 * si algo no cuadra, se descarta en vez de mostrar un producto roto.
 */
export function buildCustomProduct(row: Row): Product | null {
  const { id, section, name, inspiration, volume, notes, image_url: image, hidden } = row
  if (typeof id !== 'string' || !ID_PATTERN.test(id) || SEED_BY_ID.has(id) || row.custom !== true) return null
  const price = toCount(row.price, LIMITS.priceMin, LIMITS.priceMax)
  const stock = toCount(row.stock, 0, LIMITS.stockMax)
  const badge = toBadge(row.badge)
  if (
    !isSection(section) ||
    !isText(name, LIMITS.name) ||
    !isText(inspiration, LIMITS.inspiration) ||
    !isText(volume, LIMITS.volume) ||
    price === null ||
    stock === null ||
    !isNotes(notes) ||
    badge === undefined ||
    !isProductImageUrl(image) ||
    typeof hidden !== 'boolean'
  )
    return null
  return {
    id,
    section,
    name: name.trim(),
    inspiration: inspiration.trim(),
    volume: volume.trim(),
    price,
    stock,
    notes: cleanNotes(notes),
    badge,
    image,
    hidden,
    custom: true,
  }
}

// Mismo objeto de fila -> mismo producto: las filas que no cambiaron conservan
// su referencia y no vuelven a renderizar.
const productCache = new WeakMap<Row, Product | null>()
function cached(row: Row, build: (row: Row) => Product | null): Product | null {
  if (!productCache.has(row)) productCache.set(row, build(row))
  return productCache.get(row) ?? null
}

const timeOf = (v: unknown) => {
  const t = typeof v === 'string' ? Date.parse(v) : Number.NaN
  return Number.isNaN(t) ? 0 : t
}

/** Catálogo completo: los del código en su orden y después los agregados a mano, por fecha de creación. */
export function buildCatalog(rows: ReadonlyMap<string, Row>): Product[] {
  const base = PRODUCTS_SEED.map((seed) => {
    const row = rows.get(seed.id)
    return row ? (cached(row, (r) => mergeRow(seed, r)) ?? seed) : seed
  })
  const extra: { product: Product; at: number }[] = []
  for (const [id, row] of rows) {
    if (SEED_BY_ID.has(id)) continue
    const product = cached(row, buildCustomProduct)
    if (product) extra.push({ product, at: timeOf(row.created_at) })
  }
  extra.sort((a, b) => a.at - b.at || a.product.id.localeCompare(b.product.id))
  return [...base, ...extra.map((e) => e.product)]
}

// ---------------------------------------------------------------------------
// Validación de lo que envía el panel (la BD tiene los mismos CHECK).
// ---------------------------------------------------------------------------

function fieldValue(key: string, value: unknown): unknown {
  switch (key) {
    case 'name':
      if (isText(value, LIMITS.name)) return value.trim()
      break
    case 'inspiration':
      if (isText(value, LIMITS.inspiration)) return value.trim()
      break
    case 'volume':
      if (isText(value, LIMITS.volume)) return value.trim()
      break
    case 'price':
      if (typeof value === 'number') return toCount(value, LIMITS.priceMin, LIMITS.priceMax) ?? undefined
      break
    case 'stock':
      if (typeof value === 'number') return toCount(value, 0, LIMITS.stockMax) ?? undefined
      break
    case 'notes':
      if (isNotes(value)) return cleanNotes(value)
      break
    case 'badge':
      return toBadge(value)
    case 'section':
      if (isSection(value)) return value
      break
    case 'hidden':
      if (typeof value === 'boolean') return value
      break
  }
  return undefined
}

/** Valida un cambio y lo deja con los nombres de columna de la BD. Lanza CatalogError. */
export function cleanPatch(patch: ProductPatch, custom: boolean): Row {
  const out: Row = {}
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (!BASE_FIELDS.includes(key) && !(custom && CUSTOM_ONLY_FIELDS.includes(key)))
      throw new CatalogError('Ese dato no se puede editar en este producto.')
    const clean = fieldValue(key, value)
    if (clean === undefined) throw new CatalogError(FIELD_MESSAGES[key as keyof typeof FIELD_MESSAGES])
    out[key] = clean
  }
  return out
}

/** Valida un producto nuevo completo. Lanza CatalogError. */
export function cleanNewProduct(input: NewProductInput): Row {
  const keys = ['section', 'name', 'inspiration', 'volume', 'price', 'stock', 'notes', 'badge'] as const
  const out: Row = {}
  for (const key of keys) {
    const clean = fieldValue(key, input[key])
    if (clean === undefined) throw new CatalogError(FIELD_MESSAGES[key])
    out[key] = clean
  }
  return out
}

export function slugify(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '')
  return slug || 'perfume'
}

const randomSuffix = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => (b % 36).toString(36)).join('')

/** id = slug del nombre + sufijo aleatorio corto, que no choque con el código ni con la BD */
export function makeProductId(name: string, taken: ReadonlySet<string>): string {
  const base = slugify(name)
  for (let i = 0; i < 20; i++) {
    const id = `${base}-${randomSuffix()}`
    if (!taken.has(id) && !SEED_BY_ID.has(id)) return id
  }
  throw new CatalogError('No se pudo generar un identificador. Intenta de nuevo.')
}

/** Traduce errores de Supabase (o de red) a un mensaje claro para el admin. */
export function friendlyError(e: unknown, fallback: string): Error {
  if (e instanceof CatalogError || e instanceof ImageError) return e
  const err = (e ?? {}) as { message?: unknown; code?: unknown; status?: unknown; statusCode?: unknown }
  const message = typeof err.message === 'string' ? err.message : ''
  const status = Number(err.status ?? err.statusCode)
  if (err.code === '42501' || status === 401 || status === 403 || /row-level security|permission denied|unauthorized/i.test(message))
    return new CatalogError('Tu cuenta no tiene permisos para este cambio. Cierra sesión y vuelve a entrar.')
  if (/jwt expired/i.test(message)) return new CatalogError('Tu sesión expiró. Cierra sesión y vuelve a entrar.')
  if (status === 413 || /too large|maximum allowed size/i.test(message))
    return new CatalogError('La foto es demasiado pesada (máximo 2 MB después de reducirla).')
  if (/mime type/i.test(message)) return new CatalogError('Formato de foto no permitido. Usa JPG, PNG o WebP.')
  if (err.code === '23514') return new CatalogError('Algún dato no es válido: revisa precio, stock, textos y notas.')
  if (err.code === '23505') return new CatalogError('Ya existe un producto con ese identificador. Intenta de nuevo.')
  if (e instanceof TypeError || /failed to fetch|networkerror|network request failed|load failed/i.test(message))
    return new CatalogError('Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.')
  return new CatalogError(fallback)
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface CatalogState {
  /** Solo los visibles: es lo que usa la tienda */
  products: Product[]
  /** Todos, incluidos los ocultos: solo para el panel */
  adminProducts: Product[]
  loading: boolean
  /** Error al cargar el catálogo (los errores al guardar se lanzan en cada acción) */
  error: string | null
  fetchProducts: () => Promise<void>
  createProduct: (input: NewProductInput, file: File) => Promise<Product>
  updateProduct: (id: string, patch: ProductPatch) => Promise<void>
  replaceImage: (id: string, file: File) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

// Última versión conocida de cada fila de la BD, por id.
let rows = new Map<string, Row>()

function setRows(next: Map<string, Row>) {
  rows = next
  const all = buildCatalog(rows)
  useCatalogStore.setState({ adminProducts: all, products: all.filter((p) => !p.hidden) })
}

function applyRow(row: Row) {
  if (typeof row.id !== 'string') return
  const next = new Map(rows)
  next.set(row.id, row)
  setRows(next)
}

function dropRow(id: string) {
  if (!rows.has(id)) return
  const next = new Map(rows)
  next.delete(id)
  setRows(next)
}

function requireClient() {
  if (!supabase) throw new CatalogError(NOT_CONFIGURED)
  return supabase
}

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  products: PRODUCTS_SEED,
  adminProducts: PRODUCTS_SEED,
  loading: supabase !== null,
  error: null,

  fetchProducts: async () => {
    if (!supabase) {
      set({ loading: false })
      return
    }
    // select('*'): si el front llega antes que la migración, la tienda sigue
    // leyendo precios y stock (las columnas nuevas solo faltan).
    const { data, error } = await supabase.from('products').select('*')
    if (error) {
      set({ error: 'No se pudo cargar el catálogo desde la base de datos.', loading: false })
      return
    }
    const next = new Map<string, Row>()
    for (const row of (data ?? []) as Row[]) if (typeof row.id === 'string') next.set(row.id, row)
    setRows(next)
    set({ loading: false, error: null })
  },

  createProduct: async (input, file) => {
    const client = requireClient()
    const fields = cleanNewProduct(input)
    const problem = checkImageFile(file)
    if (problem) throw new CatalogError(problem)
    const id = makeProductId(String(fields.name), new Set(rows.keys()))

    // Primero la foto: así nunca queda un producto publicado sin imagen.
    let uploaded: { path: string; url: string }
    try {
      uploaded = await uploadProductImage(id, file)
    } catch (e) {
      throw friendlyError(e, 'No se pudo subir la foto. Intenta de nuevo.')
    }

    const { data, error } = await client
      .from('products')
      .insert({ id, ...fields, hidden: false, custom: true, image_url: uploaded.url })
      .select()
    if (error || !data || data.length !== 1) {
      void removeProductImages([uploaded.path])
      throw error ? friendlyError(error, 'No se pudo guardar el perfume. Intenta de nuevo.') : new CatalogError(ZERO_ROWS)
    }
    const row = data[0] as Row
    applyRow(row)
    const product = buildCustomProduct(row)
    if (!product) throw new CatalogError('El perfume se guardó, pero la tienda no pudo leerlo. Recarga la página.')
    return product
  },

  updateProduct: async (id, patch) => {
    const client = requireClient()
    const product = get().adminProducts.find((p) => p.id === id)
    if (!product) throw new CatalogError('Ese producto ya no existe. Recarga la página.')
    const changes = cleanPatch(patch, product.custom === true)
    if (Object.keys(changes).length === 0) return
    // RLS no da error cuando bloquea un UPDATE: simplemente no afecta filas.
    // Por eso se pide la fila actualizada y se exige que haya una (M4).
    const { data, error } = await client.from('products').update(changes).eq('id', id).select()
    if (error) throw friendlyError(error, 'No se pudo guardar. Intenta de nuevo.')
    if (!data || data.length !== 1) throw new CatalogError(ZERO_ROWS)
    applyRow(data[0] as Row)
  },

  replaceImage: async (id, file) => {
    const client = requireClient()
    if (!get().adminProducts.some((p) => p.id === id)) throw new CatalogError('Ese producto ya no existe. Recarga la página.')
    const problem = checkImageFile(file)
    if (problem) throw new CatalogError(problem)
    const previous = rows.get(id)?.image_url

    let uploaded: { path: string; url: string }
    try {
      uploaded = await uploadProductImage(id, file)
    } catch (e) {
      throw friendlyError(e, 'No se pudo subir la foto. Intenta de nuevo.')
    }

    const { data, error } = await client.from('products').update({ image_url: uploaded.url }).eq('id', id).select()
    if (error || !data || data.length !== 1) {
      void removeProductImages([uploaded.path])
      throw error ? friendlyError(error, 'No se pudo cambiar la foto. Intenta de nuevo.') : new CatalogError(ZERO_ROWS)
    }
    applyRow(data[0] as Row)
    // La foto anterior ya no se usa: se borra sin bloquear (best effort).
    const oldPath = storagePathFromUrl(previous)
    if (oldPath && oldPath !== uploaded.path) void removeProductImages([oldPath])
  },

  deleteProduct: async (id) => {
    const client = requireClient()
    const product = get().adminProducts.find((p) => p.id === id)
    if (!product?.custom) throw new CatalogError('Solo se pueden eliminar los perfumes agregados desde el panel.')
    const { data, error } = await client.from('products').delete().eq('id', id).eq('custom', true).select('id')
    if (error) throw friendlyError(error, 'No se pudo eliminar. Intenta de nuevo.')
    if (!data || data.length !== 1)
      throw new CatalogError('No se eliminó: tu cuenta no tiene permisos o el producto ya no existe. Recarga la página.')
    const imageUrl = rows.get(id)?.image_url
    dropRow(id)
    void removeProductFolder(id, imageUrl)
  },
}))

/** Carga el catálogo una vez y lo mantiene al día en todas las pestañas con Supabase Realtime. */
export function useCatalogSync() {
  const fetchProducts = useCatalogStore((s) => s.fetchProducts)

  useEffect(() => {
    void fetchProducts()
    const client = supabase
    if (!client) return

    let joined = false
    // Nombre único por montaje: con StrictMode o HMR el canal anterior puede
    // seguir cerrándose, y reutilizar su nombre devolvería ese canal.
    const channel = client
      .channel(`products-changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          // Sin REPLICA IDENTITY FULL, `old` trae solo la clave primaria.
          const id = (payload.old as Row | null)?.id
          if (typeof id === 'string') dropRow(id)
          else void fetchProducts()
          return
        }
        applyRow(payload.new as Row)
      })
      .subscribe((status) => {
        // Tras una reconexión se pudieron perder cambios: se recarga todo.
        if (status !== 'SUBSCRIBED') return
        if (joined) void fetchProducts()
        joined = true
      })

    return () => {
      void client.removeChannel(channel)
    }
  }, [fetchProducts])
}
