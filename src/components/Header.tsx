import { Search, ShoppingBag } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Section } from '../data/types'
import { useCartStore } from '../store/cartStore'
import { Logo } from './Logo'

const TABS: { id: Section; label: string }[] = [
  { id: 'hombre', label: 'Hombre' },
  { id: 'mujer', label: 'Mujer' },
  { id: 'nicho', label: 'Nicho' },
]

interface HeaderProps {
  /** Colección en pantalla (la marca la pestaña); null en la portada */
  active: string | null
  onSearchClick: () => void
  onNavigate: (id: string) => void
}

export function Header({ active, onSearchClick, onNavigate }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const count = useCartStore((s) => s.count())
  const openCart = useCartStore((s) => s.open)
  const tabRefs = useRef<Partial<Record<Section, HTMLButtonElement | null>>>({})
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const lastX = useRef(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // El indicador se mueve solo con transform: posición con translateX y ancho
  // con scaleX sobre una base de 100px. Sin pestaña activa se encoge en su lugar.
  useLayoutEffect(() => {
    const place = () => {
      const indicator = indicatorRef.current
      if (!indicator) return
      const tab = active ? tabRefs.current[active as Section] : null
      if (!tab) {
        indicator.style.transform = `translateX(${lastX.current}px) scaleX(0)`
        return
      }
      const x = tab.offsetLeft + 14
      indicator.style.transform = `translateX(${x}px) scaleX(${(tab.offsetWidth - 28) / 100})`
      lastX.current = x
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [active])

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-200 ${
        scrolled ? 'bg-forest-950/95 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between pl-4 pr-2 sm:pl-6 lg:px-10">
        <a href="#top" aria-label="FrankTester, ir al inicio" className="rounded-full">
          <Logo />
        </a>

        <div className="flex items-center">
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Buscar perfumes"
            className="grid h-11 w-11 place-items-center rounded-full text-cream/90 transition-[background-color,transform] duration-150 hover:bg-white/[0.07] active:scale-95"
          >
            <Search size={20} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            data-cart-button
            onClick={openCart}
            aria-label={`Abrir carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}
            className="relative grid h-11 w-11 place-items-center rounded-full text-cream/90 transition-[background-color,transform] duration-150 hover:bg-white/[0.07] active:scale-95"
          >
            <ShoppingBag data-cart-icon size={20} strokeWidth={1.75} />
            <span
              data-cart-ring
              className="pointer-events-none absolute inset-[5px] rounded-full border-[1.5px] border-gold-300 opacity-0"
            />
            <span
              data-cart-badge
              aria-hidden="true"
              className={`absolute -right-0.5 top-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-gold-500 px-[5px] text-[11px] font-extrabold text-forest-950 transition-[transform,opacity] duration-200 ease-lux ${
                count > 0 ? 'scale-100 opacity-100' : 'scale-[0.6] opacity-0'
              }`}
            >
              {count}
            </span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Colecciones"
        className="relative mx-auto flex max-w-7xl overflow-x-auto px-1.5 [scrollbar-width:none] sm:px-4 md:justify-center"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el
            }}
            type="button"
            onClick={() => onNavigate(tab.id)}
            aria-current={active === tab.id ? 'location' : undefined}
            className={`h-11 px-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${
              active === tab.id ? 'text-cream' : 'text-cream-muted hover:text-cream'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span
          ref={indicatorRef}
          className="tab-indicator absolute bottom-0 left-0 h-0.5 w-[100px] rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
        />
      </nav>
    </header>
  )
}
