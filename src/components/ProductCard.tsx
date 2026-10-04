import { Check, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { WHATSAPP_NUMBER } from '../config'
import type { Product } from '../data/types'
import { useProductModal } from '../hooks/useProductModal'
import { useReveal } from '../hooks/useReveal'
import { addWithFlight } from '../lib/motion'
import { useCartStore } from '../store/cartStore'
import { useToastStore } from '../store/toastStore'

const BADGE: Record<'bestseller' | 'new', { label: string; className: string }> = {
  bestseller: { label: 'Más vendido', className: 'bg-gold-500 text-forest-950' },
  new: { label: 'Nuevo', className: 'bg-trebol text-forest-950' },
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const addItem = useCartStore((s) => s.addItem)
  const showToast = useToastStore((s) => s.show)
  const { openModal } = useProductModal()
  const inStock = product.stock > 0
  const lowStock = inStock && product.stock <= 5

  // Imagen ya en caché: onLoad pudo dispararse antes de hidratar el handler
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true)
  }, [])
  useEffect(() => () => clearTimeout(addedTimer.current), [])

  const onAdd = () => {
    setAdded(true)
    clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAdded(false), 1400)
    showToast(`${product.name} agregado`, true)
    addWithFlight(imgRef.current, () => addItem(product))
  }

  const notifyHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, avísame cuando vuelva ${product.name} (${product.volume})`,
  )}`

  return (
    <div ref={ref} className={`reveal ${shown ? 'in' : ''}`} style={{ '--i': index % 4 } as CSSProperties}>
      <article className="ft-card relative isolate flex h-full flex-col overflow-hidden rounded-[18px] bg-forest-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <div className={`ft-ph relative aspect-square overflow-hidden bg-forest-900 ${loaded ? 'loaded' : ''}`}>
          <img
            ref={imgRef}
            src={product.image}
            alt={`${product.name}, inspirado en ${product.inspiration}`}
            width={500}
            height={500}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className={`h-full w-full object-cover ${inStock ? '' : 'grayscale'}`}
          />
          {product.badge && (
            <span
              className={`absolute left-2.5 top-2.5 z-[2] rounded-full px-2.5 py-[5px] text-[11.5px] font-extrabold ${BADGE[product.badge].className}`}
            >
              {BADGE[product.badge].label}
            </span>
          )}
          {!inStock && (
            <span className="absolute right-2.5 top-2.5 z-[2] rounded-full bg-forest-950/85 px-2.5 py-[5px] text-[11.5px] font-extrabold text-danger">
              Agotado
            </span>
          )}
          {lowStock && (
            <span className="absolute right-2.5 top-2.5 z-[2] rounded-full bg-forest-950/85 px-2.5 py-[5px] text-[11.5px] font-extrabold text-gold-300">
              ¡Últimas {product.stock}!
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3 lg:px-4 lg:pb-4 lg:pt-3.5">
          <h3 className="m-0 font-body text-[16.5px] font-bold tracking-normal">
            <button type="button" onClick={() => openModal(product)} className="ft-open text-left">
              {product.name}
            </button>
          </h3>
          <p className="mt-0.5 text-[13px] leading-snug text-cream-muted">Inspirado en {product.inspiration}</p>
          <p className="my-2.5 text-[19px] font-extrabold tabular-nums text-gold-300">{clp.format(product.price)}</p>

          {inStock ? (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Agregar ${product.name} al carrito`}
              className={`add-btn relative z-[2] mt-auto h-11 rounded-full bg-gold-500 text-[13.5px] font-extrabold text-forest-950 ${
                added ? 'done' : ''
              }`}
            >
              <span className="l1">
                <Plus size={16} strokeWidth={2.6} />
                Agregar
              </span>
              <span className="l2" aria-hidden="true">
                <Check size={16} strokeWidth={2.8} />
                Agregado
              </span>
            </button>
          ) : (
            <a
              href={notifyHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Avísame por WhatsApp cuando vuelva ${product.name}`}
              className="press relative z-[2] mt-auto grid h-11 place-items-center rounded-full border-[1.5px] border-whatsapp text-[13.5px] font-bold text-cream"
            >
              Avísame
            </a>
          )}
        </div>
      </article>
    </div>
  )
}
