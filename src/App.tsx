import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/hooks/use-theme'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'

// Lazy-loaded route components
const Home = lazy(() => import('@/pages/Home'))
const Diretorio = lazy(() => import('@/pages/Diretorio'))
const Cadastro = lazy(() => import('@/pages/Cadastro'))
const Area = lazy(() => import('@/pages/Area'))
const Admin = lazy(() => import('@/pages/Admin'))
const Sobre = lazy(() => import('@/pages/Sobre'))
const Privacidade = lazy(() => import('@/pages/Privacidade'))
const Termos = lazy(() => import('@/pages/Termos'))
const Contato = lazy(() => import('@/pages/Contato'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/diretorio" element={<Diretorio />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/area" element={<Area />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/sobre" element={<Sobre />} />
                  <Route path="/privacidade" element={<Privacidade />} />
                  <Route path="/termos" element={<Termos />} />
                  <Route path="/contato" element={<Contato />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
