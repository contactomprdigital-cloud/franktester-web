import { ExternalLink, LogOut, Plus, RotateCw, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AdminAddProduct } from '../../components/admin/AdminAddProduct'
import { inputClass, primaryButton, secondaryButton } from '../../components/admin/AdminField'
import { AdminProductRow } from '../../components/admin/AdminProductRow'
import { LogoMark } from '../../components/Logo'
import { SECTIONS, sectionInfo } from '../../data/sections'
import type { Section } from '../../data/types'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { useCatalogStore, useCatalogSync } from '../../store/catalogStore'

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function AdminDashboard() {
  const sessionChecked = useAdminAuthStore((s) => s.sessionChecked)
  const isAdmin = useAdminAuthStore((s) => s.isAdmin)
  const logout = useAdminAuthStore((s) => s.logout)
  const products = useCatalogStore((s) => s.adminProducts)
  const loading = useCatalogStore((s) => s.loading)
  const loadError = useCatalogStore((s) => s.error)
  const fetchProducts = useCatalogStore((s) => s.fetchProducts)
  // El panel se puede abrir directo (sin pasar por la tienda): tiene que cargar
  // el catálogo real antes de permitir editar, o se editaría sobre el código.
  useCatalogSync()

  const [adding, setAdding] = useState<Section | null>(null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  // Desplaza hasta un elemento dejándolo justo bajo el header fijo.
  const scrollToEl = (el: Element | null) => {
    if (!el) return
    const offset = (headerRef.current?.offsetHeight ?? 0) + 12
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset })
  }

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 4000)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    if (!adding || !formRef.current) return
    const offset = (headerRef.current?.offsetHeight ?? 0) + 12
    window.scrollTo({ top: formRef.current.getBoundingClientRect().top + window.scrollY - offset })
  }, [adding])

  const q = normalize(query.trim())
  const groups = useMemo(() => {
    const visible = q ? products.filter((p) => normalize(`${p.name} ${p.inspiration}`).includes(q)) : products
    return SECTIONS.map((s) => ({ ...s, items: visible.filter((p) => p.section === s.id) }))
  }, [products, q])

  if (!sessionChecked) {
    return (
      <div className="grid min-h-svh place-items-center bg-forest-950 text-sm text-cream-muted">Cargando…</div>
    )
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />

  const hiddenCount = products.filter((p) => p.hidden).length
  const results = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="min-h-svh bg-forest-950 pb-24 [color-scheme:dark]">
      <header ref={headerRef} className="sticky top-0 z-30 border-b border-white/10 bg-forest-950/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <LogoMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-display text-xl leading-none text-cream">Panel admin</h1>
              <p className="mt-1 truncate text-xs text-cream-muted">
                {products.length === 1 ? '1 perfume' : `${products.length} perfumes`}
                {hiddenCount > 0 ? ` · ${hiddenCount} ${hiddenCount === 1 ? 'oculto' : 'ocultos'}` : ''}
              </p>
            </div>
          </div>
          <nav className="flex shrink-0 items-center gap-2" aria-label="Panel">
            <Link to="/" aria-label="Ver tienda" className={`${secondaryButton} w-11 px-0 sm:w-auto sm:px-4`}>
              <ExternalLink size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Ver tienda</span>
            </Link>
            <button type="button" onClick={logout} className={secondaryButton}>
              <LogOut size={16} aria-hidden="true" /> Salir
            </button>
          </nav>
        </div>
        <nav
          aria-label="Categorías"
          className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden"
        >
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => scrollToEl(document.getElementById(`sec-${g.id}`))}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-3.5 text-sm text-cream ring-1 ring-white/10 hover:bg-white/10"
            >
              {g.label}
              <span className="text-xs text-cream-muted">{g.items.length}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        {loadError && (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-3 rounded-xl bg-danger/10 p-4 text-sm text-cream ring-1 ring-danger/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{loadError} Lo que ves puede no estar al día: no edites hasta que cargue.</p>
            <button type="button" onClick={() => fetchProducts()} className={`${secondaryButton} shrink-0`}>
              <RotateCw size={16} aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => (adding ? scrollToEl(formRef.current) : setAdding(SECTIONS[0].id))}
            disabled={loading}
            className={`${primaryButton} sm:order-2`}
          >
            <Plus size={18} aria-hidden="true" /> Agregar perfume
          </button>
          <div className="relative flex-1 sm:order-1">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream-muted"
            />
            <label htmlFor="admin-search" className="sr-only">
              Buscar perfume
            </label>
            <input
              id="admin-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o inspiración"
              autoComplete="off"
              className={`${inputClass} rounded-full pl-10`}
            />
          </div>
        </div>
        {q && (
          <p className="mt-2 text-sm text-cream-muted" role="status">
            {results === 1 ? '1 resultado' : `${results} resultados`}
          </p>
        )}

        {adding && (
          <div ref={formRef} className="mt-5">
            <AdminAddProduct
              key={adding}
              initialSection={adding}
              onCancel={() => setAdding(null)}
              onCreated={(p) => {
                setAdding(null)
                setQuery('')
                setNotice(`«${p.name}» se agregó a ${sectionInfo(p.section).label}.`)
              }}
            />
          </div>
        )}

        {loading ? (
          <p className="mt-10 text-center text-sm text-cream-muted" role="status">
            Cargando catálogo…
          </p>
        ) : (
          groups.map((g) => (
            <section key={g.id} id={`sec-${g.id}`} aria-labelledby={`sec-${g.id}-title`} className="mt-9">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id={`sec-${g.id}-title`} className="font-display text-[26px] leading-tight text-gold-300">
                  {g.title}
                </h2>
                <span className="text-sm text-cream-muted">
                  {g.items.length === 1 ? '1 perfume' : `${g.items.length} perfumes`}
                </span>
              </div>
              {g.items.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {g.items.map((product) => (
                    <AdminProductRow key={product.id} product={product} onNotice={setNotice} />
                  ))}
                </div>
              ) : q ? (
                <p className="rounded-xl px-4 py-5 text-sm text-cream-muted ring-1 ring-white/10">
                  Ningún perfume de esta categoría coincide con la búsqueda.
                </p>
              ) : (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-white/15 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-cream-muted">
                    Todavía no hay perfumes en «{g.label}». La categoría aparecerá en la tienda cuando agregues el
                    primero.
                  </p>
                  <button type="button" onClick={() => setAdding(g.id)} className={`${secondaryButton} shrink-0`}>
                    <Plus size={16} aria-hidden="true" /> Agregar el primero
                  </button>
                </div>
              )}
            </section>
          ))
        )}
      </main>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center">
        {notice && (
          <p className="pointer-events-auto max-w-md rounded-xl bg-forest-800 px-4 py-3 text-sm text-cream shadow-[0_12px_32px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.1)] motion-safe:animate-[fade-up_300ms_var(--ease-lux)_both]">
            {notice}
          </p>
        )}
      </div>
    </div>
  )
}
