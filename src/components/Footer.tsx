import { Link } from 'react-router-dom'
import logo from '../assets/logo.webp'
import { BRAND, WHATSAPP_NUMBER } from '../config'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-forest-950 pb-10 pt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <img src={logo} alt="FrankTester" className="h-14 w-14 rounded-full object-cover" />
            <p className="mt-3 font-display text-2xl text-gold-300">{BRAND.name}</p>
            <p className="text-sm text-cream/50">{BRAND.tagline} · {BRAND.city}</p>
          </div>

          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="text-xs uppercase tracking-[0.25em] text-cream/40">Navegación</p>
            <a href="#hombre" className="text-sm text-cream/70 hover:text-gold-300 transition-colors">Hombre</a>
            <a href="#mujer" className="text-sm text-cream/70 hover:text-gold-300 transition-colors">Mujer</a>
            <a href="#nicho" className="text-sm text-cream/70 hover:text-gold-300 transition-colors">Nicho / Unisex</a>
            <a href="#resenas" className="text-sm text-cream/70 hover:text-gold-300 transition-colors">Reseñas</a>
          </div>

          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="text-xs uppercase tracking-[0.25em] text-cream/40">Contacto</p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cream/70 hover:text-gold-300 transition-colors"
            >
              WhatsApp
            </a>
            <Link to="/admin" className="text-sm text-cream/30 hover:text-cream/60 transition-colors">
              Panel admin
            </Link>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-cream/30">
          © {new Date().getFullYear()} {BRAND.name}. Fragancias inspiradas — no afiliadas a las casas
          de perfumería originales.
        </p>
      </div>
    </footer>
  )
}
