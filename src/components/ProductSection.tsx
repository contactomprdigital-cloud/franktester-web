import type { Product, Section } from '../data/types'
import { ProductCard } from './ProductCard'
import { Reveal } from './Reveal'

const SECTION_META: Record<Section, { title: string; subtitle: string; kicker: string }> = {
  hombre: {
    title: 'Hombre',
    subtitle: 'Maderas, cueros y especias con carácter',
    kicker: 'text-hombre-soft',
  },
  mujer: {
    title: 'Mujer',
    subtitle: 'Florales, gourmands y frutales envolventes',
    kicker: 'text-mujer-soft',
  },
  nicho: {
    title: 'Nicho / Unisex',
    subtitle: 'Composiciones exclusivas de autor',
    kicker: 'text-nicho-soft',
  },
}

interface ProductSectionProps {
  section: Section
  products: Product[]
}

// Sin fondo propio: el color de sección lo aporta <ScrollBackground /> (fixed,
// detrás de todo) con crossfade continuo al hacer scroll — este section ya no
// pinta su propio gradiente para no volver a introducir un corte duro.
export function ProductSection({ section, products }: ProductSectionProps) {
  const meta = SECTION_META[section]

  return (
    <section id={section} className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <Reveal className="mb-10 sm:mb-14 max-w-2xl">
          <p className={`text-xs uppercase tracking-[0.3em] ${meta.kicker}`}>Colección</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl text-cream">{meta.title}</h2>
          <p className="mt-3 text-cream/60">{meta.subtitle}</p>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
