import { useEffect, useRef, useState } from 'react'
import type { SectionInfo } from '../data/sections'
import type { Product } from '../data/types'
import { ProductCard } from './ProductCard'
import { Reveal } from './Reveal'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

// Primera fila en escritorio, dos en móvil; el resto aparece con "Ver las N fragancias"
const INITIAL = 4

interface ProductSectionProps {
  section: SectionInfo
  products: Product[]
}

// Sin fondo propio: el tinte de la colección lo aporta <AmbientBackground />.
export function ProductSection({ section, products }: ProductSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Al desplegar, el foco pasa a la primera fragancia nueva (para teclado y lector de pantalla)
  useEffect(() => {
    if (expanded) gridRef.current?.children[INITIAL]?.querySelector<HTMLElement>('.ft-open')?.focus({ preventScroll: true })
  }, [expanded])

  if (products.length === 0) return null
  const prices = [...new Set(products.map((p) => p.price))].sort((a, b) => a - b)
  const priceLabel = prices.length === 1 ? `${clp.format(prices[0])} c/u` : `desde ${clp.format(prices[0])}`
  const shown = expanded ? products : products.slice(0, INITIAL)

  return (
    <section id={section.id} aria-labelledby={`${section.id}-title`} className="mx-auto max-w-[1200px] px-4 pb-5 pt-11">
      <Reveal className="mb-[18px] md:mb-7 md:text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-trebol">Colección</p>
        <h2 id={`${section.id}-title`} className="mb-1.5 mt-1 text-[clamp(38px,9vw,58px)] leading-none">
          {section.title}
        </h2>
        <p className="text-sm text-cream-muted">
          {products.length} {products.length === 1 ? 'fragancia' : 'fragancias'} · {priceLabel}
        </p>
        <span className="section-rule mt-3.5 block h-px w-[120px] origin-left bg-gradient-to-r from-gold-500 to-transparent md:mx-auto md:mt-4 md:w-[180px] md:origin-center md:from-transparent md:via-gold-500 md:to-transparent" />
      </Reveal>

      <div ref={gridRef} className="grid grid-cols-2 gap-3 min-[900px]:grid-cols-4 min-[900px]:gap-5">
        {shown.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {!expanded && products.length > INITIAL && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mx-auto mt-5 block h-[46px] rounded-full border border-gold-300/35 px-[22px] text-sm font-bold text-gold-300 transition-[background-color,transform] duration-150 hover:bg-gold-300/[0.08] active:scale-[0.97]"
        >
          Ver las {products.length} fragancias
        </button>
      )}
    </section>
  )
}
