import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { Product, Section } from '../data/types'
import { useProductModal } from '../hooks/useProductModal'
import { useCartStore } from '../store/cartStore'

const ACCENTS: Record<Section, { badge: string; text: string; ring: string; glow: string }> = {
  hombre: {
    badge: 'bg-hombre text-forest-950',
    text: 'text-hombre-soft',
    ring: 'hover:ring-hombre/50',
    glow: 'group-hover:shadow-[0_18px_50px_-12px_var(--color-hombre)]',
  },
  mujer: {
    badge: 'bg-mujer text-forest-950',
    text: 'text-mujer-soft',
    ring: 'hover:ring-mujer/50',
    glow: 'group-hover:shadow-[0_18px_50px_-12px_var(--color-mujer)]',
  },
  nicho: {
    badge: 'bg-nicho text-forest-950',
    text: 'text-nicho-soft',
    ring: 'hover:ring-nicho/50',
    glow: 'group-hover:shadow-[0_18px_50px_-12px_var(--color-nicho)]',
  },
}

const BADGE_LABEL: Record<string, string> = {
  bestseller: 'Más vendido',
  new: 'Nuevo',
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const accent = ACCENTS[product.section]
  const addItem = useCartStore((s) => s.addItem)
  const { openModal } = useProductModal()
  const inStock = product.stock > 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (index % 8) * 0.05 }}
      onClick={() => openModal(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openModal(product)
        }
      }}
      aria-label={`Ver detalle de ${product.name}`}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-forest-800/60 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:ring-2 ${accent.ring} ${accent.glow}`}
    >
      <div className="relative aspect-square overflow-hidden bg-forest-900">
        <img
          src={product.image}
          alt={`${product.name} — inspirado en ${product.inspiration}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-transparent to-transparent" />
        {product.badge && (
          <span
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${accent.badge}`}
          >
            {BADGE_LABEL[product.badge]}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cream/80 backdrop-blur-sm">
          {product.volume}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-2xl leading-tight text-cream">{product.name}</h3>
        <p className={`mt-0.5 text-[11px] uppercase tracking-[0.12em] ${accent.text}`}>
          Inspirado en {product.inspiration}
        </p>

        <dl className="mt-3 space-y-1 text-[11.5px] leading-snug text-cream/60">
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-cream/75">Salida:</dt>
            <dd className="truncate">{product.notes.top.join(', ')}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-cream/75">Corazón:</dt>
            <dd className="truncate">{product.notes.heart.join(', ')}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0 font-semibold text-cream/75">Fondo:</dt>
            <dd className="truncate">{product.notes.base.join(', ')}</dd>
          </div>
        </dl>

        <div className="mt-2 text-sm text-cream/70">
          Stock:{' '}
          <span className={inStock ? 'text-gold-300' : 'text-red-400'}>
            {inStock ? `${product.stock} disponibles` : 'Agotado'}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 pt-3">
          <span className="font-display text-xl text-gold-300">{clp.format(product.price)}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              addItem(product)
            }}
            disabled={!inStock}
            aria-label={inStock ? `Agregar ${product.name} al carrito` : `${product.name} agotado`}
            className={`flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold uppercase tracking-wide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              inStock
                ? 'bg-gold-500 text-forest-950 hover:scale-[1.05] hover:bg-gold-400 active:scale-[0.94]'
                : 'cursor-not-allowed bg-white/10 text-cream/40'
            }`}
          >
            <Plus size={15} strokeWidth={2.5} />
            {inStock ? 'Agregar' : 'Agotado'}
          </button>
        </div>
      </div>
    </motion.article>
  )
}
