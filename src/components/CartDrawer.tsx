import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { WHATSAPP_NUMBER } from '../config'
import { useCartStore } from '../store/cartStore'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const EASE_LUX = [0.22, 1, 0.36, 1] as const

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
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppMessage(lines, total),
  )}`

  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: EASE_LUX }}
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compra"
            className="fixed right-0 top-0 z-[70] flex h-[100svh] w-full max-w-md flex-col bg-forest-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-2xl text-cream">
                <ShoppingBag size={20} className="text-gold-400" /> Tu carrito
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="Cerrar carrito"
                className="grid h-11 w-11 place-items-center rounded-full text-cream/70 hover:bg-white/10 active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-cream/50">
                  <ShoppingBag size={40} strokeWidth={1.25} />
                  <p className="text-sm">Tu carrito está vacío.</p>
                  <p className="text-xs">Explora las colecciones y agrega tus fragancias favoritas.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <motion.li
                        key={line.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: EASE_LUX }}
                        className="flex items-center gap-3 rounded-xl bg-forest-800/60 p-3 ring-1 ring-white/5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-lg text-cream">{line.name}</p>
                          <p className="text-xs text-cream/50">
                            {line.volume} · {clp.format(line.price)}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQty(line.id, line.qty - 1)}
                              aria-label="Restar cantidad"
                              className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-cream ring-1 ring-white/10 hover:bg-white/10 active:scale-90 transition-all"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-5 text-center text-sm text-cream">{line.qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(line.id, line.qty + 1)}
                              aria-label="Sumar cantidad"
                              className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-cream ring-1 ring-white/10 hover:bg-white/10 active:scale-90 transition-all"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-display text-base text-gold-300">
                            {clp.format(line.price * line.qty)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(line.id)}
                            aria-label={`Quitar ${line.name}`}
                            className="grid h-8 w-8 place-items-center rounded-full text-cream/40 hover:bg-red-500/10 hover:text-red-300 active:scale-90 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-white/10 px-5 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm uppercase tracking-wide text-cream/60">Total</span>
                  <span className="font-display text-2xl text-gold-300">{clp.format(total)}</span>
                </div>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-bold uppercase tracking-wide text-forest-950 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] active:scale-[0.97]"
                >
                  <WhatsAppIcon /> Pedir por WhatsApp
                </a>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.012 2C6.495 2 2.017 6.478 2.017 11.995c0 1.996.596 3.855 1.615 5.404L2 22l4.735-1.586a9.936 9.936 0 0 0 5.276 1.51h.004c5.516 0 9.994-4.478 9.994-9.995C22.01 6.412 17.53 2 12.012 2zm0 18.19h-.003a8.155 8.155 0 0 1-4.246-1.169l-.304-.181-3.15 1.055 1.07-3.086-.198-.316a8.153 8.153 0 0 1-1.264-4.398c0-4.514 3.673-8.187 8.196-8.187 2.189 0 4.246.855 5.793 2.406a8.13 8.13 0 0 1 2.402 5.789c0 4.514-3.673 8.187-8.196 8.187z" />
    </svg>
  )
}
