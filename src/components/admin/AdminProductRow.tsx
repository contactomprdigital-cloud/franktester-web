import { Check } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '../../data/types'

type EditablePatch = Partial<Pick<Product, 'name' | 'price' | 'stock' | 'notes' | 'badge'>>

interface AdminProductRowProps {
  product: Product
  onSave: (patch: EditablePatch) => Promise<void>
}

function toText(list: string[]) {
  return list.join(', ')
}

function fromText(text: string) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const INTEGER = /^\d+$/

export function AdminProductRow({ product, onSave }: AdminProductRowProps) {
  // `original` es la versión del producto sobre la que se está editando: solo
  // se envían los campos que cambiaron respecto de ella, para no pisar en la BD
  // valores que otro admin (o una carga posterior) haya actualizado.
  const [original, setOriginal] = useState(product)
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(String(product.price))
  const [stock, setStock] = useState(String(product.stock))
  const [top, setTop] = useState(toText(product.notes.top))
  const [heart, setHeart] = useState(toText(product.notes.heart))
  const [base, setBase] = useState(toText(product.notes.base))
  const [badge, setBadge] = useState<Product['badge']>(product.badge)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const dirty =
    name !== original.name ||
    price !== String(original.price) ||
    stock !== String(original.stock) ||
    top !== toText(original.notes.top) ||
    heart !== toText(original.notes.heart) ||
    base !== toText(original.notes.base) ||
    badge !== original.badge

  // Llegó una versión nueva del producto (carga desde la BD o Realtime): si la
  // fila no tiene ediciones pendientes, se muestra la versión nueva.
  if (product !== original && !dirty) {
    setOriginal(product)
    setName(product.name)
    setPrice(String(product.price))
    setStock(String(product.stock))
    setTop(toText(product.notes.top))
    setHeart(toText(product.notes.heart))
    setBase(toText(product.notes.base))
    setBadge(product.badge)
  }

  const validate = (): string | null => {
    const trimmed = name.trim()
    if (trimmed.length < 1 || trimmed.length > 80) return 'El nombre debe tener entre 1 y 80 caracteres.'
    if (!INTEGER.test(price.trim()) || Number(price) < 1 || Number(price) > 1_000_000)
      return 'Precio inválido: usa solo números enteros entre 1 y 1.000.000 (ej. 6000).'
    if (!INTEGER.test(stock.trim()) || Number(stock) > 100_000) return 'Stock inválido: usa un número entero entre 0 y 100.000.'
    const lists = [fromText(top), fromText(heart), fromText(base)]
    if (lists.some((l) => l.length > 20 || l.some((n) => n.length > 40)))
      return 'Cada grupo de notas admite hasta 20 notas de hasta 40 caracteres.'
    return null
  }

  const handleSave = async () => {
    setSaveError(null)
    const invalid = validate()
    if (invalid) {
      setSaveError(invalid)
      return
    }
    const notes = { top: fromText(top), heart: fromText(heart), base: fromText(base) }
    const patch: EditablePatch = {}
    if (name.trim() !== original.name) patch.name = name.trim()
    if (Number(price) !== original.price) patch.price = Number(price)
    if (Number(stock) !== original.stock) patch.stock = Number(stock)
    if (JSON.stringify(notes) !== JSON.stringify(original.notes)) patch.notes = notes
    if (badge !== original.badge) patch.badge = badge
    if (Object.keys(patch).length === 0) return
    try {
      await onSave(patch)
      setOriginal({ ...original, ...patch })
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    } catch {
      setSaveError('No se pudo guardar. Intenta de nuevo.')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl bg-forest-800/50 p-4 ring-1 ring-white/10 sm:grid-cols-12 sm:items-start sm:gap-4">
      <div className="flex items-center gap-3 sm:col-span-3">
        <img src={product.image} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="truncate text-xs text-cream/40">Inspirado en {product.inspiration}</p>
          <label className="sr-only" htmlFor={`${product.id}-name`}>
            Nombre de {product.name}
          </label>
          <input
            id={`${product.id}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-0.5 w-full rounded-md bg-forest-950/70 px-2 py-1.5 text-sm text-cream outline-none ring-1 ring-white/10 focus:ring-gold-400/60"
          />
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-[10px] uppercase tracking-wide text-cream/40" htmlFor={`${product.id}-price`}>
          Precio (CLP)
        </label>
        <input
          id={`${product.id}-price`}
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min={0}
          className="w-full rounded-md bg-forest-950/70 px-2 py-1.5 text-sm text-cream outline-none ring-1 ring-white/10 focus:ring-gold-400/60"
        />
        <label className="sr-only" htmlFor={`${product.id}-badge`}>
          Etiqueta de {product.name}
        </label>
        <select
          id={`${product.id}-badge`}
          value={badge ?? ''}
          onChange={(e) => setBadge((e.target.value || null) as Product['badge'])}
          className="mt-1.5 w-full rounded-md bg-forest-950/70 px-2 py-1.5 text-xs text-cream outline-none ring-1 ring-white/10 focus:ring-gold-400/60"
        >
          <option value="">Sin etiqueta</option>
          <option value="bestseller">Más vendido</option>
          <option value="new">Nuevo</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-[10px] uppercase tracking-wide text-cream/40" htmlFor={`${product.id}-stock`}>
          Stock
        </label>
        <input
          id={`${product.id}-stock`}
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          min={0}
          className="w-full rounded-md bg-forest-950/70 px-2 py-1.5 text-sm text-cream outline-none ring-1 ring-white/10 focus:ring-gold-400/60"
        />
        {Number(stock) === 0 && <p className="mt-1 text-[10px] text-red-300">Agotado</p>}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:col-span-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-cream/40" htmlFor={`${product.id}-top`}>
            Salida
          </label>
          <input
            id={`${product.id}-top`}
            value={top}
            onChange={(e) => setTop(e.target.value)}
            className="w-full rounded-md bg-forest-950/70 px-2 py-1.5 text-xs text-cream outline-none ring-1 ring-white/10 focus:ring-gold-400/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-cream/40" htmlFor={`${product.id}-heart`}>
            Corazón
          </label>
          <input
            id={`${product.id}-heart`}
            value={heart}
            onChange={(e) => setHeart(e.target.value)}
            className="w-full rounded-md bg-forest-950/70 px-2 py-1.5 text-xs text-cream outline-none ring-1 ring-white/10 focus:ring-gold-400/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] uppercase tracking-wide text-cream/40" htmlFor={`${product.id}-base`}>
            Fondo
          </label>
          <input
            id={`${product.id}-base`}
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="w-full rounded-md bg-forest-950/70 px-2 py-1.5 text-xs text-cream outline-none ring-1 ring-white/10 focus:ring-gold-400/60"
          />
        </div>
      </div>

      <div className="flex items-center justify-end sm:col-span-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty && !saved}
          aria-label={`Guardar cambios de ${product.name}`}
          className={`flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold uppercase tracking-wide transition-all duration-300 active:scale-90 ${
            saved
              ? 'bg-emerald-500 text-forest-950'
              : dirty
                ? 'bg-gold-500 text-forest-950 hover:bg-gold-400'
                : 'bg-white/5 text-cream/30'
          }`}
        >
          {saved ? <Check size={15} /> : 'Guardar'}
        </button>
      </div>

      {saveError && <p className="sm:col-span-12 text-[10px] text-red-300">{saveError}</p>}
    </div>
  )
}
