import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import type { Section } from '../data/types'

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
}

const SECTION_OPTIONS: { value: Section | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas las secciones' },
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'nicho', label: 'Nicho / Unisex' },
]

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export function SearchFilterBar({
  filters,
  onChange,
  noteOptions,
  priceOptions,
  resultCount,
  isFiltering,
}: SearchFilterBarProps) {
  const [expanded, setExpanded] = useState(false)

  const clearAll = () =>
    onChange({ query: '', section: 'all', note: 'all', price: 'all' })

  return (
    <section id="buscador" className="relative z-20 mx-auto -mt-8 max-w-5xl px-4 sm:px-6">
      <div className="rounded-2xl bg-forest-800/80 p-3 sm:p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/50"
            />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              placeholder="Buscar por nombre o inspiración (ej. Sauvage, Rose...)"
              aria-label="Buscar por nombre o inspiración"
              className="h-11 w-full rounded-full bg-forest-950/70 pl-10 pr-4 text-sm text-cream placeholder:text-cream/40 outline-none ring-1 ring-white/10 transition-all focus:ring-2 focus:ring-gold-400/60"
            />
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label="Mostrar filtros"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-300 active:scale-90 ${
              expanded ? 'bg-gold-500 text-forest-950 ring-gold-500' : 'text-cream/80 ring-white/10 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={17} strokeWidth={1.75} />
          </button>
        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            expanded ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="flex flex-wrap gap-2 pt-1">
              <select
                value={filters.section}
                onChange={(e) => onChange({ ...filters, section: e.target.value as Section | 'all' })}
                className="h-10 rounded-full bg-forest-950/70 px-4 text-xs text-cream ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-gold-400/60"
              >
                {SECTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.note}
                onChange={(e) => onChange({ ...filters, note: e.target.value })}
                className="h-10 max-w-[45%] rounded-full bg-forest-950/70 px-4 text-xs text-cream ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-gold-400/60"
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
                onChange={(e) =>
                  onChange({ ...filters, price: e.target.value === 'all' ? 'all' : Number(e.target.value) })
                }
                className="h-10 rounded-full bg-forest-950/70 px-4 text-xs text-cream ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-gold-400/60"
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
                  className="flex h-10 items-center gap-1 rounded-full bg-white/5 px-3 text-xs text-cream/70 ring-1 ring-white/10 hover:bg-white/10"
                >
                  <X size={13} /> Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {isFiltering && (
          <p className="mt-2 px-1 text-[11px] text-cream/50">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </p>
        )}
      </div>
    </section>
  )
}
