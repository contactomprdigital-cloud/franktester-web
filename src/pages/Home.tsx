import { useMemo, useState } from 'react'
import { CartDrawer } from '../components/CartDrawer'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { ProductCard } from '../components/ProductCard'
import { ProductSection } from '../components/ProductSection'
import { Reveal } from '../components/Reveal'
import { Reviews } from '../components/Reviews'
import { ScrollBackground } from '../components/ScrollBackground'
import { SearchFilterBar, type Filters } from '../components/SearchFilterBar'
import { REVIEWS_SEED } from '../data/reviews'
import { useCatalogStore, useCatalogSync } from '../store/catalogStore'

const EMPTY_FILTERS: Filters = { query: '', section: 'all', note: 'all', price: 'all' }

export function Home() {
  useCatalogSync()
  const products = useCatalogStore((s) => s.products)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const noteOptions = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      ;[...p.notes.top, ...p.notes.heart, ...p.notes.base].forEach((n) => set.add(n))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [products])

  const priceOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.price))).sort((a, b) => a - b),
    [products],
  )

  const isFiltering =
    filters.query.trim() !== '' || filters.section !== 'all' || filters.note !== 'all' || filters.price !== 'all'

  const filteredProducts = useMemo(() => {
    if (!isFiltering) return []
    const q = filters.query.trim().toLowerCase()
    return products.filter((p) => {
      if (q && !`${p.name} ${p.inspiration}`.toLowerCase().includes(q)) return false
      if (filters.section !== 'all' && p.section !== filters.section) return false
      if (filters.price !== 'all' && p.price !== filters.price) return false
      if (
        filters.note !== 'all' &&
        !p.notes.top.includes(filters.note) &&
        !p.notes.heart.includes(filters.note) &&
        !p.notes.base.includes(filters.note)
      )
        return false
      return true
    })
  }, [products, filters, isFiltering])

  const bySection = (section: 'hombre' | 'mujer' | 'nicho') => products.filter((p) => p.section === section)

  return (
    <div className="min-h-screen">
      <ScrollBackground />
      <Header onSearchClick={() => document.getElementById('buscador')?.scrollIntoView({ behavior: 'smooth' })} />
      <Hero />

      <SearchFilterBar
        filters={filters}
        onChange={setFilters}
        noteOptions={noteOptions}
        priceOptions={priceOptions}
        resultCount={filteredProducts.length}
        isFiltering={isFiltering}
      />

      {isFiltering ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <Reveal className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-gold-400">Resultados</p>
            <h2 className="mt-2 font-display text-4xl text-cream">
              {filteredProducts.length
                ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'fragancia encontrada' : 'fragancias encontradas'}`
                : 'Sin resultados'}
            </h2>
          </Reveal>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-cream/50">Prueba con otro nombre, nota olfativa o sección.</p>
          )}
        </section>
      ) : (
        <>
          <ProductSection section="hombre" products={bySection('hombre')} />
          <ProductSection section="mujer" products={bySection('mujer')} />
          <ProductSection section="nicho" products={bySection('nicho')} />
        </>
      )}

      <Reviews reviews={REVIEWS_SEED} />
      <Footer />
      <CartDrawer />
    </div>
  )
}
