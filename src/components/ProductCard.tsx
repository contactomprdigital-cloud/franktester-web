import { Check, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Product } from '../data/types'
import { useReveal } from '../hooks/useReveal'
import { addWithFlight } from '../lib/motion'
import { productLink } from '../lib/whatsapp'
import { useProductModalStore } from '../store/productModalStore'
import { useToastStore } from '../store/toastStore'
import { ProductImage } from './ProductImage'

const BADGE: Record<'bestseller' | 'new', { label: string; className: string }> = {
  bestseller: { label: 'Más vendido', className: 'bg-gold-500 text-forest-950' },
  new: { label: 'Nuevo', className: 'bg-trebol text-forest-950' },
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  const imgRef = useRef<HTMLImageElement>(null)
  // URL ya cargada (o fallida): el brillo de carga se apaga y la foto entra con un fundido
  const [settledSrc, setSettledSrc] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showToast = useToastStore((s) => s.show)
  const openModal = useProductModalStore((s) => s.open)
  const inStock = product.stock > 0
  const lowStock = inStock && product.stock <= 5
  const settled = !product.image || settledSrc === product.image

  useEffect(() => () => clearTimeout(addedTimer.current), [])

  const onAdd = () => {
    // Si ya no cabe otra unidad, addWithFlight muestra el aviso del motivo y no hay "Agregado"
    if (!addWithFlight(imgRef.current, product)) return
    setAdded(true)
    clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAdded(false), 1400)
    showToast(`${product.name} agregado`, true)
  }

  // Solo se muestra con stock 0: el helper arma el aviso de reposición
  const notifyHref = productLink(product)

  return (
    <div ref={ref} className={`reveal ${shown ? 'in' : ''}`} style={{ '--i': index % 4 } as CSSProperties}>
      <article className="ft-card relative isolate flex h-full flex-col overflow-hidden rounded-[18px] bg-forest-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <div className={`ft-ph relative aspect-square overflow-hidden bg-forest-900 ${settled ? 'loaded' : ''}`}>
          <ProductImage
            ref={imgRef}
            src={product.image}
            alt={`${product.name}, inspirado en ${product.inspiration}`}
            width={500}
            height={500}
            loading="lazy"
            onLoad={() => setSettledSrc(product.image)}
            onError={() => setSettledSrc(product.image)}
            className={`h-full w-full object-cover ${inStock ? '' : 'opacity-60 grayscale'}`}
          />
          {/* Etiquetas apiladas: en la tarjeta de 2 columnas no caben una al lado de la otra */}
          {(product.badge || !inStock || lowStock) && (
            <div className="absolute left-2.5 top-2.5 z-[2] flex flex-col items-start gap-1.5 text-xs font-extrabold">
              {product.badge && (
                <span className={`rounded-full px-2.5 py-[5px] ${BADGE[product.badge].className}`}>
                  {BADGE[product.badge].label}
                </span>
              )}
              {!inStock && <span className="rounded-full bg-forest-950/85 px-2.5 py-[5px] text-danger">Agotado</span>}
              {lowStock && (
                <span className="rounded-full bg-forest-950/85 px-2.5 py-[5px] text-gold-300">¡Últimas {product.stock}!</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3 min-[900px]:px-4 min-[900px]:pb-4 min-[900px]:pt-3.5">
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
              className={`add-btn relative z-[2] mt-auto h-11 rounded-full text-[13.5px] font-extrabold text-forest-950 ${
                added ? 'done' : ''
              }`}
            >
              <span className="l1">
                <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
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
