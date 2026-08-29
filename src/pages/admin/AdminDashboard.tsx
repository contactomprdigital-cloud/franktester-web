import { ExternalLink, LogOut, RotateCcw } from 'lucide-react'
import { Navigate, Link } from 'react-router-dom'
import { AdminProductRow } from '../../components/admin/AdminProductRow'
import logo from '../../assets/logo.webp'
import type { Section } from '../../data/types'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { useCatalogStore } from '../../store/catalogStore'

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'hombre', label: 'Hombre' },
  { key: 'mujer', label: 'Mujer' },
  { key: 'nicho', label: 'Nicho / Unisex' },
]

export function AdminDashboard() {
  const sessionChecked = useAdminAuthStore((s) => s.sessionChecked)
  const isAuthed = useAdminAuthStore((s) => s.isAuthed)
  const logout = useAdminAuthStore((s) => s.logout)
  const products = useCatalogStore((s) => s.products)
  const updateProduct = useCatalogStore((s) => s.updateProduct)
  const resetToSeed = useCatalogStore((s) => s.resetToSeed)

  if (!sessionChecked) return null
  if (!isAuthed) return <Navigate to="/admin/login" replace />

  return (
    <div className="min-h-screen bg-forest-950 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-forest-950/95 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-3">
          <img src={logo} alt="FrankTester" className="h-9 w-9 rounded-full object-cover" />
          <div>
            <p className="font-display text-lg leading-tight text-cream">Panel Admin</p>
            <p className="text-[11px] text-cream/40 leading-tight">{products.length} fragancias en catálogo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/5 px-3 text-xs text-cream/80 ring-1 ring-white/10 hover:bg-white/10"
          >
            <ExternalLink size={14} /> Ver sitio
          </Link>
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Restaurar todos los productos a sus valores originales del catálogo?')) resetToSeed()
            }}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/5 px-3 text-xs text-cream/80 ring-1 ring-white/10 hover:bg-white/10"
          >
            <RotateCcw size={14} /> Restaurar
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/5 px-3 text-xs text-cream/80 ring-1 ring-white/10 hover:bg-white/10"
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {SECTIONS.map(({ key, label }) => (
          <section key={key} className="mb-10">
            <h2 className="mb-3 font-display text-2xl text-gold-300">{label}</h2>
            <div className="flex flex-col gap-3">
              {products
                .filter((p) => p.section === key)
                .map((product) => (
                  <AdminProductRow
                    key={product.id}
                    product={product}
                    onSave={(patch) => updateProduct(product.id, patch)}
                  />
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
