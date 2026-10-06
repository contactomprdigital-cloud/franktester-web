import { BRAND } from '../config'
import type { Section } from '../data/types'
import { useVisibleSections } from '../hooks/useVisibleSections'
import { generalLink } from '../lib/whatsapp'
import { Logo } from './Logo'

// min-h-11: área táctil de 44 px aunque el texto sea chico
const LINK =
  'inline-flex min-h-11 items-center px-2 text-[13px] font-semibold text-cream-muted transition-colors duration-150 hover:text-gold-300 active:opacity-70'

export function Footer({ onNavigate }: { onNavigate: (id: Section) => void }) {
  const sections = useVisibleSections()

  return (
    <footer className="mx-auto mt-10 max-w-[1200px] border-t border-white/[0.08] px-5 pb-16 pt-7 text-[13px] leading-relaxed text-cream-muted md:text-center">
      <div className="mb-3 flex md:justify-center">
        <Logo />
      </div>
      <p>
        {BRAND.name} · {BRAND.tagline} · {BRAND.city}
      </p>

      <nav aria-label="Enlaces del pie" className="-mx-2 my-2 flex flex-wrap md:justify-center">
        {sections.map((section) => (
          <button key={section.id} type="button" onClick={() => onNavigate(section.id)} className={LINK}>
            {section.label}
          </button>
        ))}
        <a href={generalLink()} target="_blank" rel="noopener noreferrer" className={LINK}>
          WhatsApp
        </a>
      </nav>

      <p>
        Fragancias inspiradas en perfumes de marca. {BRAND.name} no está afiliado a las casas originales.
        <br />© {new Date().getFullYear()} {BRAND.name}
      </p>
    </footer>
  )
}
