import { Check } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useCartStore } from '../store/cartStore'
import { useProductModalStore } from '../store/productModalStore'
import { useToastStore } from '../store/toastStore'

/** Aviso "X agregado · Ver carrito": reemplaza a abrir el carrito en cada "Agregar". */
export function Toast() {
  const message = useToastStore((s) => s.message)
  const withCartAction = useToastStore((s) => s.withCartAction)
  const visible = useToastStore((s) => s.visible)
  const hide = useToastStore((s) => s.hide)
  const openCart = useCartStore((s) => s.open)

  const onViewCart = () => {
    hide()
    useProductModalStore.getState().close()
    openCart()
  }

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`toast fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 z-[95] flex max-w-[calc(100vw-24px)] items-center gap-3 whitespace-nowrap rounded-full border border-gold-300/25 bg-[#0f2a1a] py-2 pl-4 pr-2 text-sm shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] ${
        visible ? 'show' : 'pointer-events-none'
      }`}
    >
      <Check size={18} className="text-trebol" aria-hidden="true" />
      <span className="truncate">{message}</span>
      {withCartAction && (
        <button
          type="button"
          onClick={onViewCart}
          tabIndex={visible ? 0 : -1}
          className="h-9 shrink-0 rounded-full bg-gold-500 px-3.5 text-[13px] font-extrabold text-forest-950"
        >
          Ver carrito
        </button>
      )}
    </div>,
    document.body,
  )
}
