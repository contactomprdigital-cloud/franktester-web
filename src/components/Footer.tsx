import { Link } from 'react-router-dom'
import { BRAND, WHATSAPP_NUMBER } from '../config'
import { Logo } from './Logo'

const LINK = 'inline-flex min-h-11 items-center text-sm text-cream-muted transition-colors hover:text-gold-300'

export function Footer({ onNavigate }: { onNavigate: (id: string) => void }) {
  return (
    <footer className="mt-10 border-t border-white/[0.08] bg-forest-950/80 pb-10 pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Logo />
            <p className="m-0 text-sm text-cream-muted">
              {BRAND.tagline} · {BRAND.city}
            </p>
          </div>

          <nav aria-label="Colecciones" className="flex flex-col items-center sm:items-start">
            <p className="mb-1 mt-0 text-xs uppercase tracking-[0.25em] text-cream-muted">Colecciones</p>
            <button type="button" onClick={() => onNavigate('hombre')} className={LINK}>
              Hombre
            </button>
            <button type="button" onClick={() => onNavigate('mujer')} className={LINK}>
              Mujer
            </button>
            <button type="button" onClick={() => onNavigate('nicho')} className={LINK}>
              Nicho / Unisex
            </button>
          </nav>

          <div className="flex flex-col items-center sm:items-start">
            <p className="mb-1 mt-0 text-xs uppercase tracking-[0.25em] text-cream-muted">Contacto</p>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className={LINK}>
              WhatsApp
            </a>
            <Link to="/admin" className={LINK}>
              Panel admin
            </Link>
          </div>
        </div>

        <p className="mb-0 mt-10 text-center text-xs text-cream-muted">
          © {new Date().getFullYear()} {BRAND.name}. Fragancias inspiradas — no afiliadas a las casas de perfumería
          originales.
        </p>
      </div>
    </footer>
  )
}
