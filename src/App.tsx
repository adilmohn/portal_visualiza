import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/hooks/use-theme'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'

// Lazy-loaded route components
const Home = lazy(() => import('@/pages/Home'))
const Diretorio = lazy(() => import('@/pages/Diretorio'))
const Login = lazy(() => import('@/pages/Login'))
const Cadastro = lazy(() => import('@/pages/Cadastro'))
const Area = lazy(() => import('@/pages/Area'))
const Admin = lazy(() => import('@/pages/Admin'))
const Sobre = lazy(() => import('@/pages/Sobre'))
const Privacidade = lazy(() => import('@/pages/Privacidade'))
const Termos = lazy(() => import('@/pages/Termos'))
const Contato = lazy(() => import('@/pages/Contato'))
const Detalhe = lazy(() => import('@/pages/Detalhe'))
const Planos = lazy(() => import('@/pages/Planos'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/diretorio" element={<Diretorio />} />
                    <Route path="/detalhe/:id" element={<Detalhe />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cadastro" element={<Cadastro />} />
                    <Route path="/sobre" element={<Sobre />} />
                    <Route path="/privacidade" element={<Privacidade />} />
                    <Route path="/termos" element={<Termos />} />
                    <Route path="/contato" element={<Contato />} />
                    <Route path="/planos" element={<Planos />} />

                    {/* Rotas protegidas */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/area" element={<Area />} />
                    </Route>

                    {/* Rota administrativa protegida (apenas role admin) */}
                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                      <Route path="/admin" element={<Admin />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
