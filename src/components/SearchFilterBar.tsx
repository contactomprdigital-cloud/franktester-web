import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useState, type Ref } from 'react'
import { isSection } from '../data/sections'
import type { Section } from '../data/types'
import { useVisibleSections } from '../hooks/useVisibleSections'

export interface Filters {
  query: string
  section: Section | 'all'
  note: string | 'all'
  price: number | 'all'
}

interface SearchFilterBarProps {
  filters: Filters
  onChange: (filters: Filters) => void
  noteOptions: string[]
  priceOptions: number[]
  resultCount: number
  isFiltering: boolean
  inputRef?: Ref<HTMLInputElement>
}

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

// text-base en móvil: iOS hace zoom al enfocar campos de menos de 16px.
// Borde dorado a 3,4:1 sobre la superficie (mínimo 3:1 para controles).
const FIELD =
  'h-11 rounded-full bg-forest-950/80 px-4 text-base text-cream outline-none ring-1 ring-gold-300/45 focus-visible:ring-2 focus-visible:ring-gold-300 md:text-sm'

export function SearchFilterBar({
  filters,
  onChange,
  noteOptions,
  priceOptions,
  resultCount,
  isFiltering,
  inputRef,
}: SearchFilterBarProps) {
  const sections = useVisibleSections()
  const [expanded, setExpanded] = useState(false)

  const clearAll = () => onChange({ query: '', section: 'all', note: 'all', price: 'all' })

  return (
    <section id="buscador" aria-label="Buscar perfumes" className="relative z-20 mx-auto max-w-5xl px-4 sm:px-6">
      <div className="rounded-2xl bg-forest-900 p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-muted"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              placeholder="Buscar por nombre o inspiración (ej. Sauvage)"
              aria-label="Buscar por nombre o inspiración"
              enterKeyHint="search"
              className={`${FIELD} w-full pl-10 placeholder:text-cream-muted`}
            />
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="filtros"
            aria-label={expanded ? 'Ocultar filtros' : 'Mostrar filtros'}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 transition-[background-color,transform] duration-200 active:scale-90 ${
              expanded ? 'bg-gold-500 text-forest-950 ring-gold-500' : 'text-cream ring-gold-300/45 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={17} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Sin animar la altura (provoca layout): el panel aparece y su contenido entra con opacidad y transform */}
        <div id="filtros" hidden={!expanded} className="filters-in mt-3 flex flex-wrap gap-2 p-1">
          <select
            value={filters.section}
            onChange={(e) => onChange({ ...filters, section: isSection(e.target.value) ? e.target.value : 'all' })}
            aria-label="Filtrar por colección"
            className={FIELD}
          >
            <option value="all">Todas las colecciones</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>

          <select
            value={filters.note}
            onChange={(e) => onChange({ ...filters, note: e.target.value })}
            aria-label="Filtrar por nota olfativa"
            className={`${FIELD} max-w-[60%]`}
          >
            <option value="all">Toda nota olfativa</option>
            {noteOptions.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>

          <select
            value={filters.price}
            onChange={(e) => onChange({ ...filters, price: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
            aria-label="Filtrar por precio"
            className={FIELD}
          >
            <option value="all">Todo precio</option>
            {priceOptions.map((price) => (
              <option key={price} value={price}>
                {clp.format(price)}
              </option>
            ))}
          </select>

          {isFiltering && (
            <button
              type="button"
              onClick={clearAll}
              className="flex h-11 items-center gap-1 rounded-full bg-white/5 px-4 text-sm text-cream ring-1 ring-gold-300/45 hover:bg-white/10"
            >
              <X size={14} aria-hidden="true" /> Limpiar
            </button>
          )}
        </div>

        {/* Siempre montado (región aria-live): sin filtros solo deja de ocupar espacio */}
        <p className={isFiltering ? 'mt-2 px-1 text-[13px] text-cream-muted' : 'sr-only'} aria-live="polite">
          {isFiltering ? `${resultCount} ${resultCount === 1 ? 'resultado' : 'resultados'}` : ''}
        </p>
      </div>
    </section>
  )
}
