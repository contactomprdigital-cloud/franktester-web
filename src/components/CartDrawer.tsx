import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { WHATSAPP_NUMBER } from '../config'
import { useCartStore } from '../store/cartStore'
import { useCatalogStore } from '../store/catalogStore'
import { WhatsAppIcon } from './icons'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

function buildWhatsAppMessage(lines: { name: string; qty: number; price: number; volume: string }[], total: number) {
  const header = 'Hola FrankTester! Quiero hacer este pedido:'
  const items = lines
    .map((l) => `• ${l.qty}x ${l.name} (${l.volume}) — ${clp.format(l.price * l.qty)}`)
    .join('\n')
  const footer = `\n\nTotal: ${clp.format(total)}\n\n¿Cómo seguimos con el pago y despacho?`
  return `${header}\n\n${items}${footer}`
}

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen)
  const close = useCartStore((s) => s.close)
  const lines = useCartStore((s) => s.lines)
  const setQty = useCartStore((s) => s.setQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = useCartStore((s) => s.total())
  const products = useCatalogStore((s) => s.products)
  const [staggerIn, setStaggerIn] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const imageById = new Map(products.map((p) => [p.id, p.image]))
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppMessage(lines, total),
  )}`

  // Abierto: cascada de entrada de las líneas (solo al abrir, no al cambiar
  // cantidades), página inerte y sin scroll, Escape cierra y el foco vuelve
  useEffect(() => {
    if (!isOpen) return
    setStaggerIn(true)
    const staggerTimer = setTimeout(() => setStaggerIn(false), 900)
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus({ preventScroll: true })
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(staggerTimer)
      root?.removeAttribute('inert')
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
      opener?.focus({ preventScroll: true })
    }
  }, [isOpen, close])

  return createPortal(
    <>
      <div onClick={close} className={`scrim fixed inset-0 z-[80] bg-[rgba(2,8,5,0.62)] ${isOpen ? 'show' : ''}`} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        aria-hidden={!isOpen}
        className={`drawer fixed inset-y-0 right-0 z-[81] flex w-full max-w-[420px] flex-col bg-forest-900 shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.85)] ${
          isOpen ? 'open' : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] py-3 pl-5 pr-2.5">
          <h2 id="cart-title" className="m-0 flex items-center gap-2 text-[30px]">
            <ShoppingBag size={20} className="text-gold-400" aria-hidden="true" /> Tu carrito
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="grid h-11 w-11 place-items-center rounded-full text-cream/80 transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center text-cream-muted">
            <ShoppingBag size={40} strokeWidth={1.25} aria-hidden="true" />
            <p className="m-0 text-sm">Tu carrito está vacío.</p>
            <p className="m-0 text-xs">Explora las colecciones y agrega tus fragancias favoritas.</p>
          </div>
        ) : (
          <ul
            className={`drawer-list m-0 grid flex-1 list-none content-start gap-2.5 overflow-y-auto overscroll-contain px-4 py-3.5 ${
              staggerIn ? 'stagger' : ''
            }`}
          >
            {lines.map((line, i) => (
              <li
                key={line.id}
                className="drawer-line flex items-center gap-3 rounded-2xl bg-forest-800 p-2.5"
                style={{ '--i': i } as CSSProperties}
              >
                {imageById.get(line.id) && (
                  <img
                    src={imageById.get(line.id)}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[15px] font-bold">{line.name}</p>
                  <p className="m-0 text-[12.5px] text-cream-muted">
                    {line.volume} · {clp.format(line.price)}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQty(line.id, line.qty - 1)}
                      aria-label={`Quitar uno de ${line.name}`}
                      className="grid h-9 w-11 place-items-center rounded-full border border-white/[0.12] transition-transform duration-100 active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="min-w-[22px] text-center font-bold tabular-nums" aria-live="polite">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(line.id, line.qty + 1)}
                      aria-label={`Agregar uno de ${line.name}`}
                      className="grid h-9 w-11 place-items-center rounded-full border border-white/[0.12] transition-transform duration-100 active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="font-extrabold tabular-nums text-gold-300">{clp.format(line.price * line.qty)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    aria-label={`Quitar ${line.name} del carrito`}
                    className="grid h-11 w-11 place-items-center rounded-full text-cream-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="border-t border-white/[0.08] px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[13px] uppercase tracking-[0.12em] text-cream-muted">Total</span>
              <strong className="text-[28px] font-extrabold tabular-nums text-gold-300">{clp.format(total)}</strong>
            </div>
            <p className="mb-3.5 mt-0 text-[13px] text-cream-muted">
              Coordinas el pago y el envío por WhatsApp. Envíos a todo Chile.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="press flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-whatsapp text-[15px] font-extrabold text-forest-950"
            >
              <WhatsAppIcon className="h-5 w-5" /> Pedir por WhatsApp
            </a>
          </div>
        )}
      </aside>
    </>,
    document.body,
  )
}
