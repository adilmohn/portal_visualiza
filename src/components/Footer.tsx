import { Link } from 'react-router-dom'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-border bg-background/50">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          {/* Brand & tag */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Portal <span className="text-primary">Viabilize</span>
            </span>
            <p className="text-xs text-muted-foreground">
              Portal Viabilize — Feito para viabilizar. &copy; {currentYear}
            </p>
          </div>

          {/* Institutional links */}
          <nav
            aria-label="Links institucionais"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground"
          >
            <Link
              to="/sobre"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              Sobre
            </Link>
            <Link
              to="/privacidade"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              Privacidade
            </Link>
            <Link
              to="/termos"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              Termos
            </Link>
            <Link
              to="/contato"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5"
            >
              Contato
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
