import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'

const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
)
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={null}>
            <AdminLogin />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <Suspense fallback={null}>
            <AdminDashboard />
          </Suspense>
        }
      />
    </Routes>
  )
}
