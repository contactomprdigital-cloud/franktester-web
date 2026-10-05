import { Search, ShoppingBag } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Section } from '../data/types'
import { shortLabel, useVisibleSections } from '../hooks/useVisibleSections'
import { useCartStore } from '../store/cartStore'
import { Logo } from './Logo'

interface HeaderProps {
  /** Colección en pantalla (la marca la pestaña); null en la portada */
  active: Section | null
  onSearchClick: () => void
  onNavigate: (id: Section) => void
}

export function Header({ active, onSearchClick, onNavigate }: HeaderProps) {
  const sections = useVisibleSections()
  const [scrolled, setScrolled] = useState(false)
  const count = useCartStore((s) => s.count())
  const openCart = useCartStore((s) => s.open)
  const navRef = useRef<HTMLElement>(null)
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
      const tab = active ? navRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`) : null
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
  }, [active, sections])

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-200 ${
        scrolled ? 'bg-forest-950/95 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.8)]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between pl-4 pr-2">
        <a href="#top" aria-label="FrankTester, ir al inicio" className="rounded-full">
          <Logo />
        </a>

        <div className="flex items-center">
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Buscar perfumes"
            className="grid h-11 w-11 place-items-center rounded-full text-cream transition-[background-color,transform] duration-150 hover:bg-white/[0.07] active:scale-95"
          >
            <Search size={20} strokeWidth={1.9} aria-hidden="true" />
          </button>
          <button
            type="button"
            data-cart-button
            onClick={openCart}
            aria-label={`Abrir carrito, ${count} ${count === 1 ? 'producto' : 'productos'}`}
            className="relative grid h-11 w-11 place-items-center rounded-full text-cream transition-[background-color,transform] duration-150 hover:bg-white/[0.07] active:scale-95"
          >
            <ShoppingBag data-cart-icon size={20} strokeWidth={1.9} aria-hidden="true" />
            <span
              data-cart-ring
              className="pointer-events-none absolute inset-[5px] rounded-full border-[1.5px] border-gold-300 opacity-0"
            />
            <span
              data-cart-badge
              aria-hidden="true"
              className={`absolute right-px top-[3px] grid h-[19px] min-w-[19px] place-items-center rounded-full bg-gold-500 px-[5px] text-xs font-extrabold text-forest-950 transition-[transform,opacity] duration-200 ease-lux ${
                count > 0 ? 'scale-100 opacity-100' : 'scale-[0.6] opacity-0'
              }`}
            >
              {count}
            </span>
          </button>
        </div>
      </div>

      <nav
        ref={navRef}
        aria-label="Colecciones"
        className="relative mx-auto flex max-w-[1200px] overflow-x-auto px-1.5 [scrollbar-width:none] md:justify-center"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            data-tab={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
            aria-current={active === section.id ? 'location' : undefined}
            className={`h-11 shrink-0 px-3.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${
              active === section.id ? 'text-cream' : 'text-cream-muted hover:text-cream'
            }`}
          >
            {shortLabel(section)}
          </button>
        ))}
        <span
          ref={indicatorRef}
          aria-hidden="true"
          className="tab-indicator absolute bottom-0 left-0 h-0.5 w-[100px] rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
        />
      </nav>
    </header>
  )
}
