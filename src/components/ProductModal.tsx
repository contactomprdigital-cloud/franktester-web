import { Check, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { OlfactoryNotes, Product } from '../data/types'
import { useDialog } from '../hooks/useDialog'
import { addWithFlight } from '../lib/motion'
import { productLink } from '../lib/whatsapp'
import { useCartStore } from '../store/cartStore'
import { useProductModalStore } from '../store/productModalStore'
import { useToastStore } from '../store/toastStore'
import { CloverIcon, WhatsAppIcon } from './icons'
import { ProductImage } from './ProductImage'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const stagger = (i: number) => ({ '--i': i }) as CSSProperties

const NOTE_GROUPS: { key: keyof OlfactoryNotes; label: string }[] = [
  { key: 'top', label: 'Salida' },
  { key: 'heart', label: 'Corazón' },
  { key: 'base', label: 'Fondo' },
]
const BADGE_LABEL = { bestseller: 'Más vendido', new: 'Nuevo' } as const

/** Ficha de producto: hoja que sube desde abajo en móvil (se cierra arrastrando), modal en escritorio. */
export function ProductModal() {
  const product = useProductModalStore((s) => s.selectedProduct)
  const lucky = useProductModalStore((s) => s.lucky)
  const seq = useProductModalStore((s) => s.seq)
  const close = useProductModalStore((s) => s.close)
  const addItem = useCartStore((s) => s.addItem)
  const showToast = useToastStore((s) => s.show)

  // Queda montada al cerrar, con el último producto, para poder animar la salida
  const [current, setCurrent] = useState<Product | null>(product)
  if (product && product !== current) setCurrent(product)
  // La clase "open" llega un frame después de montar el contenido: así corre la cascada de entrada
  const [shownSeq, setShownSeq] = useState(0)
  const open = product !== null && shownSeq === seq
  // Apertura en la que se tocó "Agregar" (otra apertura vuelve a mostrar "Agregar al carrito")
  const [addedSeq, setAddedSeq] = useState<number | null>(null)
  const added = addedSeq === seq

  const sheetRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ y0: number; y: number; t: number; v: number } | null>(null)
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!product) return
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    const frame = requestAnimationFrame(() => setShownSeq(seq))
    return () => cancelAnimationFrame(frame)
  }, [product, seq])

  useDialog(open, sheetRef, close, { initialFocus: closeRef })

  useEffect(() => () => clearTimeout(addedTimer.current), [])

  // Arrastrar hacia abajo para cerrar (solo móvil): sigue al dedo y decide por distancia o velocidad
  const onDragStart = (e: PointerEvent<HTMLDivElement>) => {
    const sheet = sheetRef.current
    if (!sheet || window.matchMedia('(min-width: 768px)').matches) return
    drag.current = { y0: e.clientY, y: e.clientY, t: performance.now(), v: 0 }
    sheet.style.transition = 'none'
    if (scrimRef.current) scrimRef.current.style.transition = 'none'
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onDragMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    const sheet = sheetRef.current
    if (!d || !sheet) return
    const now = performance.now()
    d.v = (e.clientY - d.y) / Math.max(1, now - d.t)
    d.y = e.clientY
    d.t = now
    const dy = Math.max(0, e.clientY - d.y0)
    sheet.style.transform = `translateY(${dy}px)`
    if (scrimRef.current) scrimRef.current.style.opacity = String(Math.max(0, 1 - dy / sheet.offsetHeight))
  }
  const onDragEnd = () => {
    const d = drag.current
    const sheet = sheetRef.current
    if (!d || !sheet) return
    drag.current = null
    const dy = Math.max(0, d.y - d.y0)
    sheet.style.transition = ''
    sheet.style.transform = ''
    if (scrimRef.current) {
      scrimRef.current.style.transition = ''
      scrimRef.current.style.opacity = ''
    }
    if (dy > 140 || d.v > 0.6) close()
  }

  const onAdd = () => {
    if (!current) return
    const item = current
    setAddedSeq(seq)
    clearTimeout(addedTimer.current)
    addedTimer.current = setTimeout(() => setAddedSeq(null), 1400)
    showToast(`${item.name} agregado`, true)
    addWithFlight(imgRef.current, () => addItem(item))
  }

  const onWhatsApp = () => {
    if (!current) return
    window.open(productLink(current), '_blank', 'noopener,noreferrer')
  }

  const inStock = (current?.stock ?? 0) > 0

  return createPortal(
    <>
      <div
        ref={scrimRef}
        onClick={close}
        className={`scrim fixed inset-0 z-[70] bg-[rgba(2,8,5,0.62)] ${open ? 'show' : ''}`}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-sheet-title"
        aria-hidden={!open}
        className={`sheet fixed inset-x-0 bottom-0 z-[71] flex max-h-[92dvh] flex-col rounded-t-[26px] bg-forest-900 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.85)] md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[86vh] md:w-[min(900px,92vw)] md:rounded-3xl ${
          open ? 'open' : ''
        }`}
      >
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="grid h-[26px] shrink-0 cursor-grab touch-none place-items-center md:hidden"
        >
          <span className="h-[5px] w-[42px] rounded-full bg-white/30" />
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute right-3 top-[34px] z-[3] grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white transition-transform duration-150 active:scale-90 md:right-3.5 md:top-3.5"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {current && (
          <>
            <div ref={scrollRef} className="overflow-y-auto overscroll-contain">
              <div className="px-4 pb-2 md:grid md:grid-cols-2 md:items-start md:gap-7 md:px-6 md:pt-6">
                <div className="sheet-media overflow-hidden rounded-[18px] bg-forest-950">
                  <ProductImage
                    ref={imgRef}
                    src={current.image}
                    alt={`${current.name}, inspirado en ${current.inspiration}`}
                    width={500}
                    height={500}
                    className="aspect-square w-full object-contain"
                  />
                </div>

                <div className="px-1 pb-1.5 pt-[18px] md:pt-1.5">
                  {lucky && (
                    <span
                      className="st mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-trebol/15 px-[11px] py-[5px] text-[12.5px] font-bold text-[#7fe09a]"
                      style={stagger(0)}
                    >
                      <CloverIcon className="h-3.5 w-3.5" />
                      Tu fragancia de la suerte
                    </span>
                  )}
                  <p className="st text-sm font-semibold text-gold-300" style={stagger(0)}>
                    Inspirado en {current.inspiration}
                  </p>
                  <h2 id="product-sheet-title" className="st mb-2.5 mt-0.5 text-[40px] leading-none" style={stagger(1)}>
                    {current.name}
                  </h2>
                  <div className="st flex flex-wrap items-center gap-2" style={stagger(2)}>
                    <strong className="mr-1 text-[25px] font-extrabold tabular-nums text-gold-300">
                      {clp.format(current.price)}
                    </strong>
                    <span className="rounded-full bg-forest-800 px-2.5 py-[5px] text-xs font-semibold text-cream-muted">
                      {current.volume}
                    </span>
                    {current.badge && (
                      <span className="rounded-full bg-forest-800 px-2.5 py-[5px] text-xs font-semibold text-cream-muted">
                        {BADGE_LABEL[current.badge]}
                      </span>
                    )}
                    {!inStock && (
                      <span className="rounded-full bg-forest-800 px-2.5 py-[5px] text-xs font-semibold text-danger">
                        Agotado
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3.5 px-1 py-[18px]">
                    {NOTE_GROUPS.map((group, k) =>
                      current.notes[group.key].length > 0 ? (
                        <div key={group.key} className="st" style={stagger(3 + k)}>
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-cream-muted">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {current.notes[group.key].map((note) => (
                              <span key={note} className="rounded-full bg-forest-800 px-3 py-1.5 text-sm">
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2.5 border-t border-white/[0.08] bg-forest-900 px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 md:px-6 md:pb-[18px] md:pt-3.5">
              {inStock ? (
                <button
                  type="button"
                  onClick={onAdd}
                  aria-label={`Agregar ${current.name} al carrito`}
                  className={`add-btn h-[52px] flex-1 rounded-full bg-gold-500 text-[15px] font-extrabold text-forest-950 ${
                    added ? 'done' : ''
                  }`}
                >
                  <span className="l1">
                    <Plus size={17} strokeWidth={2.6} aria-hidden="true" />
                    Agregar al carrito
                  </span>
                  <span className="l2" aria-hidden="true">
                    <Check size={17} strokeWidth={2.8} />
                    Agregado
                  </span>
                </button>
              ) : (
                <span className="grid h-[52px] flex-1 place-items-center rounded-full bg-white/10 text-[15px] font-bold text-cream-muted">
                  Agotado
                </span>
              )}
              <button
                type="button"
                onClick={onWhatsApp}
                aria-label={inStock ? 'Consultar por WhatsApp' : 'Avísame por WhatsApp'}
                className="press flex h-[52px] items-center gap-2 rounded-full border-[1.5px] border-whatsapp px-4 text-sm font-bold"
              >
                <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
                {inStock ? 'Consultar' : 'Avísame'}
              </button>
            </div>
          </>
        )}
      </div>
    </>,
    document.body,
  )
}
