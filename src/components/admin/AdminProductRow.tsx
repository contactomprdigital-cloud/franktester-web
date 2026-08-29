import { Check } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '../../data/types'

interface AdminProductRowProps {
  product: Product
  onSave: (patch: Partial<Product>) => Promise<void>
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

export function AdminProductRow({ product, onSave }: AdminProductRowProps) {
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
    name !== product.name ||
    price !== String(product.price) ||
    stock !== String(product.stock) ||
    top !== toText(product.notes.top) ||
    heart !== toText(product.notes.heart) ||
    base !== toText(product.notes.base) ||
    badge !== product.badge

  const handleSave = async () => {
    const parsedPrice = Number(price)
    const parsedStock = Number(stock)
    setSaveError(null)
    try {
      await onSave({
        name: name.trim() || product.name,
        price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : product.price,
        stock: Number.isFinite(parsedStock) ? Math.max(0, parsedStock) : 0,
        notes: { top: fromText(top), heart: fromText(heart), base: fromText(base) },
        badge,
      })
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
