import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import logo from '../assets/logo.webp'
import { useCartStore } from '../store/cartStore'

const NAV_LINKS = [
  { href: '#hombre', label: 'Hombre' },
  { href: '#mujer', label: 'Mujer' },
  { href: '#nicho', label: 'Nicho' },
  { href: '#resenas', label: 'Reseñas' },
]

interface HeaderProps {
  onSearchClick: () => void
  onNavigate: (id: string) => void
}

export function Header({ onSearchClick, onNavigate }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const count = useCartStore((s) => s.count())
  const openCart = useCartStore((s) => s.open)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-500`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)' }}
    >
      <div
        className={`transition-colors duration-500 ${
          scrolled
            ? 'bg-forest-950/90 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
            : 'bg-gradient-to-b from-black/40 to-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
          <a href="#top" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="FrankTester" className="h-11 w-11 rounded-full object-cover" />
            <span className="font-display text-xl sm:text-2xl tracking-wide text-gold-300">
              Frank<span className="text-gold-500">Tester</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(link.href.slice(1))
                }}
                className="text-sm uppercase tracking-[0.14em] text-cream/80 hover:text-gold-300 transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onSearchClick}
              aria-label="Buscar perfumes"
              className="grid place-items-center h-11 w-11 rounded-full text-cream/90 hover:bg-white/10 active:scale-95 transition-all duration-200"
            >
              <Search size={20} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={openCart}
              aria-label="Abrir carrito"
              className="relative grid place-items-center h-11 w-11 rounded-full text-cream/90 hover:bg-white/10 active:scale-95 transition-all duration-200"
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-[11px] font-bold text-forest-950"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Abrir menú"
              className="grid place-items-center h-11 w-11 rounded-full text-cream/90 hover:bg-white/10 active:scale-95 transition-all duration-200 md:hidden"
            >
              {menuOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden bg-forest-950/95 backdrop-blur-md"
          >
            <div className="flex flex-col px-6 py-4 gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    setMenuOpen(false)
                    onNavigate(link.href.slice(1))
                  }}
                  className="py-3 text-base uppercase tracking-[0.14em] text-cream/85 border-b border-white/5 last:border-0"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
