// Mismas curvas que los tokens --ease-lux y --ease-move de index.css, para WAAPI
export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const EASE_MOVE = 'cubic-bezier(0.77, 0, 0.175, 1)'

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Agrega al carrito con el frasco viajando en arco hasta la bolsa del header:
 * X con ease-in-out, Y sube y luego baja. El contador se actualiza al aterrizar.
 * Con movimiento reducido (o sin imagen) agrega directo.
 */
export function addWithFlight(img: HTMLImageElement | null, add: () => void) {
  const target = document.querySelector<HTMLElement>('[data-cart-button]')
  if (!img || !target || prefersReducedMotion()) {
    add()
    bumpCart()
    return
  }
  const s = img.getBoundingClientRect()
  const t = target.getBoundingClientRect()
  const size = Math.min(s.width, 150)
  const sx = s.left + s.width / 2 - size / 2
  const sy = s.top + s.height / 2 - size / 2
  const dx = t.left + t.width / 2 - (sx + size / 2)
  const dy = t.top + t.height / 2 - (sy + size / 2)

  const outer = document.createElement('div')
  outer.style.cssText = `position:fixed;z-index:96;pointer-events:none;left:${sx}px;top:${sy}px;width:${size}px;height:${size}px`
  const clone = document.createElement('img')
  clone.src = img.currentSrc || img.src
  clone.alt = ''
  clone.style.cssText =
    'display:block;width:100%;height:100%;object-fit:cover;border-radius:16px;box-shadow:0 20px 40px -10px rgba(0,0,0,.7)'
  outer.appendChild(clone)
  document.body.appendChild(outer)

  const duration = 720
  outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], {
    duration,
    easing: EASE_MOVE,
    fill: 'forwards',
  })
  clone
    .animate(
      [
        { transform: 'translateY(0) scale(1)', opacity: 1, easing: EASE_OUT },
        { transform: `translateY(${Math.min(dy * 0.2, 0) - 70}px) scale(.78)`, opacity: 1, offset: 0.35, easing: EASE_MOVE },
        { transform: `translateY(${dy}px) scale(.14)`, opacity: 0.6 },
      ],
      { duration, fill: 'forwards' },
    )
    .finished.catch(() => {})
    .finally(() => {
      outer.remove()
      add()
      bumpCart()
    })
}

/** La bolsa da un pequeño salto, suelta un anillo dorado y el contador entra desde abajo. */
export function bumpCart() {
  const icon = document.querySelector<SVGElement>('[data-cart-icon]')
  const ring = document.querySelector<HTMLElement>('[data-cart-ring]')
  const badge = document.querySelector<HTMLElement>('[data-cart-badge]')
  if (prefersReducedMotion()) {
    badge?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease' })
    return
  }
  icon?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)', offset: 0.35 }, { transform: 'scale(1)' }], {
    duration: 420,
    easing: EASE_OUT,
  })
  ring?.animate([{ opacity: 0.7, transform: 'scale(.8)' }, { opacity: 0, transform: 'scale(1.8)' }], {
    duration: 560,
    easing: EASE_OUT,
  })
  badge?.animate([{ transform: 'translateY(55%)', opacity: 0 }, { transform: 'none', opacity: 1 }], {
    duration: 240,
    easing: EASE_OUT,
  })
}
