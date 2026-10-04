import { useMemo, useRef, useState } from 'react'
import { AmbientBackground } from '../components/AmbientBackground'
import { CartDrawer } from '../components/CartDrawer'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { ProductCard } from '../components/ProductCard'
import { ProductModal } from '../components/ProductModal'
import { ProductSection } from '../components/ProductSection'
import { Reveal } from '../components/Reveal'
import { SearchFilterBar, type Filters } from '../components/SearchFilterBar'
import { Toast } from '../components/Toast'
import type { Section } from '../data/types'
import { useActiveSection } from '../hooks/useActiveSection'
import { useProductModal } from '../hooks/useProductModal'
import { useCatalogStore, useCatalogSync } from '../store/catalogStore'

const EMPTY_FILTERS: Filters = { query: '', section: 'all', note: 'all', price: 'all' }
const SECTION_IDS = ['hombre', 'mujer', 'nicho'] as const

// "limon" encuentra "Limón Split": la búsqueda ignora tildes y mayúsculas
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function Home() {
  useCatalogSync()
  const products = useCatalogStore((s) => s.products)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const { selectedProduct, lucky, closeModal } = useProductModal()
  const searchInputRef = useRef<HTMLInputElement>(null)

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
    const q = normalize(filters.query.trim())
    return products.filter((p) => {
      if (q && !normalize(`${p.name} ${p.inspiration}`).includes(q)) return false
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

  const bySection = (section: Section) => products.filter((p) => p.section === section)

  // Colección en pantalla: marca la pestaña del header y el tinte del fondo
  const active = useActiveSection(SECTION_IDS, !isFiltering)

  // Tinte mientras se filtra: si el filtro de sección está fijado, ese es el
  // color correcto sin ambigüedad. Si no (ej. filtrando solo por nota), pero
  // todos los resultados son de una misma sección, igual aplica su color; si
  // están mezclados, queda el fondo neutro.
  const resultSection: Section | null = isFiltering
    ? filters.section !== 'all'
      ? filters.section
      : filteredProducts.length > 0 && filteredProducts.every((p) => p.section === filteredProducts[0].section)
        ? filteredProducts[0].section
        : null
    : null
  const tint = isFiltering ? (resultSection ?? 'top') : ((active as Section | null) ?? 'top')

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }

  const handleNavigate = (id: string) => {
    if ((id === 'hombre' || id === 'mujer' || id === 'nicho') && isFiltering) {
      // La sección no existe en el DOM mientras se filtra (se reemplaza por
      // #resultados): limpiar filtros primero y esperar al siguiente frame,
      // ya con la sección de vuelta en el DOM, para poder hacer scroll.
      setFilters(EMPTY_FILTERS)
      requestAnimationFrame(() => scrollToId(id))
      return
    }
    scrollToId(id)
  }

  // El botón de búsqueda del header lleva al buscador y deja el cursor en el campo
  const handleSearchClick = () => {
    scrollToId('buscador')
    searchInputRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="min-h-screen">
      <AmbientBackground tint={tint} />
      <Header active={isFiltering ? null : active} onSearchClick={handleSearchClick} onNavigate={handleNavigate} />
      <Hero onNavigate={handleNavigate} />

      <SearchFilterBar
        filters={filters}
        onChange={setFilters}
        noteOptions={noteOptions}
        priceOptions={priceOptions}
        resultCount={filteredProducts.length}
        isFiltering={isFiltering}
        inputRef={searchInputRef}
      />

      {isFiltering ? (
        <section id="resultados" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
          <Reveal className="mb-8">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-trebol">Resultados</p>
            <h2 className="mb-0 mt-1 text-4xl text-cream">
              {filteredProducts.length
                ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'fragancia encontrada' : 'fragancias encontradas'}`
                : 'Sin resultados'}
            </h2>
          </Reveal>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {filteredProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <p className="text-cream-muted">Prueba con otro nombre, nota olfativa o sección.</p>
          )}
        </section>
      ) : (
        <>
          <ProductSection section="hombre" products={bySection('hombre')} />
          <ProductSection section="mujer" products={bySection('mujer')} />
          <ProductSection section="nicho" products={bySection('nicho')} />
        </>
      )}

      {/* Reseñas ocultas hasta tener reseñas reales: src/data/reviews.ts es contenido de ejemplo */}
      <Footer onNavigate={handleNavigate} />
      <CartDrawer />
      <ProductModal product={selectedProduct} lucky={lucky} onClose={closeModal} />
      <Toast />
    </div>
  )
}
