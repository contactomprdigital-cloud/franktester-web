import type { Product, Section } from '../data/types'
import { ProductCard } from './ProductCard'
import { Reveal } from './Reveal'

const TITLES: Record<Section, string> = {
  hombre: 'Hombre',
  mujer: 'Mujer',
  nicho: 'Nicho · Unisex',
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

interface ProductSectionProps {
  section: Section
  products: Product[]
}

// Sin fondo propio: el tinte de la colección lo aporta <AmbientBackground />.
export function ProductSection({ section, products }: ProductSectionProps) {
  if (products.length === 0) return null
  const prices = [...new Set(products.map((p) => p.price))].sort((a, b) => a - b)
  const priceLabel = prices.length === 1 ? `${clp.format(prices[0])} c/u` : `desde ${clp.format(prices[0])}`

  return (
    <section id={section} className="mx-auto max-w-7xl px-4 pb-5 pt-11 sm:px-6 lg:px-10">
      <Reveal className="mb-[18px] md:mb-7 md:text-center">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-trebol">Colección</p>
        <h2 className="mb-1.5 mt-1 text-[clamp(38px,9vw,58px)] leading-none">{TITLES[section]}</h2>
        <p className="m-0 text-sm text-cream-muted">
          {products.length} fragancias · {priceLabel}
        </p>
        <span className="section-rule mt-3.5 block h-px w-[120px] origin-left bg-gradient-to-r from-gold-500 to-transparent md:mx-auto md:mt-4 md:w-[180px] md:origin-center md:from-transparent md:via-gold-500 md:to-transparent" />
      </Reveal>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </section>
  )
}
