import { Minus, PackageX, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useMemo, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useDialog } from '../hooks/useDialog'
import { formatClp, orderLink } from '../lib/whatsapp'
import { cartTotal, isAvailable, resolveCart, useCartStore } from '../store/cartStore'
import { useCatalogStore } from '../store/catalogStore'
import { WhatsAppIcon } from './icons'
import { ProductImage } from './ProductImage'

// Si quien abrió el carrito ya no está (ej. el aviso "Ver carrito" se ocultó), el foco vuelve a la bolsa del header
const cartButton = () => document.querySelector<HTMLElement>('[data-cart-button]')

// El "+" en el tope usa aria-disabled y no disabled: un botón disabled pierde el foco y el teclado salta al inicio del diálogo
const STEP_BUTTON =
  'hit-44 relative grid h-9 w-11 place-items-center rounded-full border border-white/[0.12] transition-transform duration-100 active:scale-95 aria-disabled:opacity-35 aria-disabled:active:scale-100'
const REMOVE_BUTTON =
  '-mr-1.5 grid h-11 w-11 place-items-center rounded-full text-cream-muted transition-colors duration-150 hover:bg-danger/10 hover:text-danger'

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen)
  const close = useCartStore((s) => s.close)
  const lines = useCartStore((s) => s.lines)
  const setQty = useCartStore((s) => s.setQty)
  const removeItem = useCartStore((s) => s.removeItem)
  // Nombre, precio, volumen e imagen salen siempre del catálogo; el carrito solo guarda id y cantidad
  const products = useCatalogStore((s) => s.products)
  const loading = useCatalogStore((s) => s.loading)
  const drawerRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useDialog(isOpen, drawerRef, close, { initialFocus: closeButtonRef, fallbackFocus: cartButton })

  const entries = useMemo(() => resolveCart(lines, products), [lines, products])
  const orderable = entries.filter(isAvailable)
  const total = cartTotal(entries)
  const hasUnavailable = orderable.length < entries.length
  // Con el catálogo cargando aún faltan los precios al día: el pedido espera
  const canOrder = orderable.length > 0 && !loading
  const whatsappHref = orderLink(
    orderable.map((e) => ({ name: e.product.name, volume: e.product.volume, price: e.product.price, qty: e.qty })),
  )

  return createPortal(
    <>
      <div onClick={close} className={`scrim fixed inset-0 z-[80] bg-[rgba(2,8,5,0.62)] ${isOpen ? 'show' : ''}`} />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        aria-hidden={!isOpen}
        className={`drawer fixed inset-y-0 right-0 z-[81] flex w-full max-w-[420px] flex-col bg-forest-900 shadow-[-20px_0_60px_-20px_rgba(0,0,0,0.85)] ${
          isOpen ? 'open' : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] py-3 pl-5 pr-2.5">
          <h2 id="cart-title" className="m-0 text-[30px] leading-tight">
            Tu carrito
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="grid h-11 w-11 place-items-center rounded-full text-cream transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-90"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center text-cream-muted">
            <ShoppingBag size={40} strokeWidth={1.25} aria-hidden="true" />
            <p className="text-sm">
              Tu carrito está vacío.
              <br />
              Explora las colecciones y agrega tus favoritos.
            </p>
          </div>
        ) : (
          <ul className="m-0 grid flex-1 list-none grid-cols-[minmax(0,1fr)] content-start gap-2.5 overflow-y-auto overscroll-contain px-4 py-3.5">
            {entries.map((entry, i) => {
              const { product } = entry
              const style = { '--i': i } as CSSProperties

              if (isAvailable(entry)) {
                const atMax = entry.qty >= entry.max
                return (
                  <li
                    key={entry.id}
                    className="drawer-line flex items-center gap-2.5 rounded-2xl bg-forest-800 p-2.5 min-[360px]:gap-3"
                    style={style}
                  >
                    <ProductImage
                      src={entry.product.image}
                      alt=""
                      width={64}
                      height={64}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{entry.product.name}</p>
                      <p className="text-[12.5px] text-cream-muted">
                        {entry.product.volume} · {formatClp(entry.product.price)}
                        {atMax && (
                          <>
                            {' '}
                            <span className="whitespace-nowrap">· Máximo</span>
                          </>
                        )}
                      </p>
                      <div className="mt-1 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setQty(entry.id, entry.qty - 1)}
                          aria-label={`Quitar uno de ${entry.product.name}`}
                          className={STEP_BUTTON}
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>
                        <span className="min-w-[22px] text-center font-bold tabular-nums" aria-live="polite">
                          {entry.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!atMax) setQty(entry.id, entry.qty + 1)
                          }}
                          aria-disabled={atMax}
                          aria-label={`Agregar uno de ${entry.product.name}`}
                          className={STEP_BUTTON}
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-extrabold tabular-nums text-gold-300">
                        {formatClp(entry.product.price * entry.qty)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(entry.id)}
                        aria-label={`Quitar ${entry.product.name} del carrito`}
                        className={REMOVE_BUTTON}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                )
              }

              // Mientras carga el catálogo, un producto agregado desde el panel aún puede no estar: no es "no disponible"
              const pending = loading && !product
              return (
                <li key={entry.id} className="drawer-line flex items-center gap-3 rounded-2xl bg-forest-800/60 p-2.5" style={style}>
                  {product ? (
                    <ProductImage
                      src={product.image}
                      alt=""
                      width={64}
                      height={64}
                      loading="lazy"
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-xl object-cover opacity-50 grayscale"
                    />
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-forest-900 text-cream-muted">
                      <PackageX size={26} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-cream-muted">
                      {pending ? 'Cargando producto…' : (product?.name ?? 'Ya no disponible')}
                    </p>
                    <p className="text-[12.5px] text-cream-muted">
                      {pending ? (
                        'Actualizando el catálogo'
                      ) : (
                        <>
                          {product && <span className="text-danger">Ya no disponible · </span>}
                          No va en tu pedido
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(entry.id)}
                    aria-label={product ? `Quitar ${product.name} del carrito` : 'Quitar el producto no disponible del carrito'}
                    className={REMOVE_BUTTON}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {entries.length > 0 && (
          <div className="border-t border-white/[0.08] px-5 pb-[calc(18px+env(safe-area-inset-bottom))] pt-4">
            {orderable.length > 0 && (
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-[13px] uppercase tracking-[0.12em] text-cream-muted">Total</span>
                <strong className="text-[28px] font-extrabold tabular-nums text-gold-300" aria-live="polite">
                  {formatClp(total)}
                </strong>
              </div>
            )}
            <p className="mb-3.5 text-[13px] text-cream-muted">
              {hasUnavailable && !loading
                ? 'Lo que ya no está disponible no suma al total ni va en tu pedido.'
                : 'Coordinas el pago y el envío por WhatsApp. Envíos a todo Chile.'}
            </p>
            {canOrder ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="press flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-whatsapp text-[15px] font-extrabold text-forest-950"
              >
                <WhatsAppIcon className="h-5 w-5" /> Pedir por WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex h-[54px] w-full items-center justify-center rounded-full bg-white/10 text-[15px] font-bold text-cream-muted"
              >
                {loading ? 'Actualizando precios…' : 'Nada disponible para pedir'}
              </button>
            )}
          </div>
        )}
      </aside>
    </>,
    document.body,
  )
}
