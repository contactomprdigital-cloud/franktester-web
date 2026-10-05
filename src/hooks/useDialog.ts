import { useEffect, useRef, type RefObject } from 'react'

interface OpenDialog {
  el: HTMLElement
  returnTo: HTMLElement | null
}

// Diálogos abiertos, el último arriba: solo ese responde a Escape y a Tab
const stack: OpenDialog[] = []

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const canFocus = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement &&
  el.isConnected &&
  !el.closest('[inert]') &&
  el.getClientRects().length > 0 &&
  getComputedStyle(el).visibility !== 'hidden'

// Con un diálogo abierto, la página queda inerte (ni foco ni lector de pantalla) y sin scroll
function syncPage() {
  const locked = stack.length > 0
  document.getElementById('root')?.toggleAttribute('inert', locked)
  document.documentElement.classList.toggle('dialog-open', locked)
}

interface DialogOptions {
  /** Recibe el foco al abrir (normalmente el botón de cerrar) */
  initialFocus?: RefObject<HTMLElement | null>
  /** Destino del foco al cerrar si quien abrió ya no se puede enfocar */
  fallbackFocus?: () => HTMLElement | null
}

/**
 * Diálogo modal accesible: fondo inerte y sin scroll, foco atrapado adentro,
 * Escape cierra y, al cerrar, el foco vuelve a quien lo abrió.
 */
export function useDialog(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  options: DialogOptions = {},
) {
  const latest = useRef({ onClose, options })
  useEffect(() => {
    latest.current = { onClose, options }
  })

  useEffect(() => {
    const el = ref.current
    if (!open || !el) return
    // Si reemplaza a otro diálogo (ej. "Ver carrito" desde la ficha), hereda su destino de foco
    const returnTo = stack.length
      ? stack[stack.length - 1].returnTo
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const entry: OpenDialog = { el, returnTo }
    stack.push(entry)
    syncPage()
    ;(latest.current.options.initialFocus?.current ?? el).focus({ preventScroll: true })

    const onKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== entry) return
      if (e.key === 'Escape') {
        e.preventDefault()
        latest.current.onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = [...el.querySelectorAll(FOCUSABLE)].filter(canFocus)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !el.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !el.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      stack.splice(stack.indexOf(entry), 1)
      syncPage()
      if (stack.length > 0) return
      const target = canFocus(returnTo) ? returnTo : (latest.current.options.fallbackFocus?.() ?? null)
      target?.focus({ preventScroll: true })
    }
  }, [open, ref])
}
