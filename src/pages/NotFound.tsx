import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { FileQuestion, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const location = useLocation()

  useEffect(() => {
    console.error('404: Página não encontrada no caminho:', location.pathname)
  }, [location.pathname])

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center animate-fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FileQuestion className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
      <span className="text-sm font-semibold uppercase tracking-wider text-primary">Erro 404</span>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        Página não encontrada
      </h1>
      <p className="mt-3 text-base text-muted-foreground max-w-md">
        A página que você está procurando não existe ou foi movida para outro endereço.
      </p>
      <div className="mt-6">
        <Button
          asChild
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-2.5 rounded shadow-sm inline-flex items-center gap-2"
        >
          <Link to="/">
            <Home className="h-4 w-4" />
            Voltar ao Início
          </Link>
        </Button>
      </div>
    </div>
  )
}
